# Mini React 执行流程理解

这份文档只解释当前仓库里的实现，不完全等同于 React 官方源码。

你的整体理解是对的：

> React 收到更新后，会从根节点开始向下遍历，创建或复用 Fiber，计算子节点并打标记；走到底后再向上遍历，创建 DOM、收集子树标记；最后进入 commit 阶段，根据标记真正操作 DOM。

不过要注意一点：打标记不只发生在向下阶段。比如新增、删除标记主要在协调子节点时产生；文本更新标记是在 `completeWork` 向上阶段比较新旧文本时产生。

## 1. 一张总路线图

```txt
ReactDOM.createRoot(container).render(<App />)
  |
  v
createRoot(container)
  |
  v
createContainer(container)
  |
  |-- 创建 HostRoot Fiber
  |-- 创建 FiberRootNode
  |-- 给 HostRoot Fiber 创建 updateQueue
  |
  v
render(element)
  |
  v
updateContainer(element, root)
  |
  |-- createUpdate(element)
  |-- enqueueUpdate(hostRootFiber.updateQueue, update)
  |
  v
scheduleUpdateOnFiber(hostRootFiber)
  |
  |-- markUpdateFromToRoot(fiber)
  |   从当前 fiber 一直向上找 HostRoot
  |
  v
renderRoot(root)
  |
  |-- prepareRefreshStack(root)
  |   创建或复用 root.current 的 alternate，作为 workInProgress
  |
  |-- workLoop()
  |   render 阶段：构建 workInProgress Fiber 树
  |
  |-- root.finishedWork = root.current.alternate
  |
  v
commitRoot(root)
  |
  |-- commitMutationEffects(finishedWork)
  |   根据 flags 真正插入、更新、删除 DOM
  |
  v
root.current = finishedWork
```

## 2. current 和 workInProgress 是什么

当前代码里使用双缓存。

```txt
current tree
屏幕上已经提交的旧 Fiber 树

workInProgress tree
本轮 render 正在计算的新 Fiber 树
```

每个 Fiber 通过 `alternate` 指向另一棵树中对应的节点：

```txt
currentFiber <--------> workInProgressFiber
       alternate   alternate
```

对应代码在 `createWorkInProgress`：

```ts
let wip = current.alternate;

if (wip === null) {
  wip = new FiberNode(current.tag, pendingProps, current.key);
  wip.alternate = current;
  current.alternate = wip;
} else {
  wip.pendingProps = pendingProps;
  wip.flags = NoFlags;
  wip.subtreeFlags = NoFlags;
  wip.deletions = null;
}
```

所以它不是每次都重新创建一整棵树。

第一次没有 `alternate`，就创建。

后续已有 `alternate`，就复用。

commit 结束后：

```ts
root.current = finishedWork;
```

这一步就是切换新旧树：本轮算好的 `workInProgress` 变成新的 `current`。

## 3. render 阶段：向下 beginWork

入口在 `workLoop`：

```ts
function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

每个 Fiber 会先执行：

```ts
const next = beginWork(fiber);
```

`beginWork` 的核心作用是：

1. 看当前 Fiber 是什么类型。
2. 计算它的子节点。
3. 创建或复用子 Fiber。
4. 返回第一个子 Fiber，让流程继续向下走。

路线大概是：

```txt
performUnitOfWork(fiber)
  |
  v
beginWork(fiber)
  |
  |-- HostRoot
  |   updateHostRoot
  |   处理 updateQueue，拿到根节点要渲染的 element
  |
  |-- HostComponent
  |   updateHostComponent
  |   从 props.children 拿到子节点
  |
  |-- FunctionComponent
  |   updateFuncitonComponent
  |   renderWithHooks(wip)，执行函数组件，拿到返回的 ReactElement
  |
  |-- HostText
      没有子节点，返回 null
```

如果 `beginWork` 返回了子 Fiber：

```ts
workInProgress = next;
```

流程继续向下。

如果返回 `null`，说明这个 Fiber 没有子节点，开始进入向上阶段。

## 4. reconcileChildren：创建或复用子 Fiber

在 `beginWork` 里，最终会走到：

```ts
reconcileChildren(wip, nextChildren);
```

这里会判断当前 Fiber 有没有旧节点：

```ts
const current = wip.alternate;

if (current !== null) {
  wip.child = reconcileChildFibers(wip, current.child, children);
} else {
  wip.child = mountChildFibers(wip, null, children);
}
```

可以这样理解：

```txt
没有 current
  => mount
  => 第一次创建子 Fiber
  => 不追踪副作用

有 current
  => update
  => 新旧子节点对比
  => 需要追踪 Placement / ChildDeletion 等副作用
```

当前代码只实现了单节点场景：

```txt
新旧 key 相同，并且 type 相同
  => useFiber(currentFiber, element.props)
  => 复用旧 Fiber 的 alternate

key 不同，或者 type 不同
  => deleteChild(returnFiber, currentFiber)
  => 创建新的 Fiber
```

## 5. flags 是什么时候打的

当前项目主要有这些 flags：

```ts
Placement      // 插入
Update         // 更新
ChildDeletion  // 删除子节点
```

### Placement

在 `childFibers.ts`：

```ts
if (shouldTrackEffects && fiber.alternate === null) {
  fiber.flags |= Placement;
}
```

意思是：

```txt
update 阶段发现这个 Fiber 是新创建的
  => 它没有 alternate
  => commit 阶段需要插入 DOM
  => 打 Placement 标记
```

### ChildDeletion

在 `deleteChild`：

```ts
returnFiber.deletions = [childToDelete];
returnFiber.flags |= ChildDeletion;
```

意思是：

```txt
旧子 Fiber 不应该存在了
  => 把它放进父 Fiber 的 deletions 数组
  => 给父 Fiber 打 ChildDeletion 标记
```

### Update

在 `completeWork.ts` 的 HostText 分支：

```ts
const oldText = current.memoizedProps.content;
const newText = newProps.content;

if (oldText !== newText) {
  markUpdate(wip);
}
```

意思是：

```txt
文本节点复用成功了
但是文本内容变了
  => 给文本 Fiber 打 Update 标记
```

## 6. complete 阶段：向上 completeWork

当某个 Fiber 没有子节点时：

```ts
if (next === null) {
  completeUnitOfWork(fiber);
}
```

`completeUnitOfWork` 会向上回溯：

```txt
complete 当前节点
  |
  |-- 有 sibling
  |   去 sibling，继续 beginWork
  |
  |-- 没有 sibling
      回到 return，也就是父 Fiber
      complete 父 Fiber
```

这就是你说的“然后又向上遍历”。

`completeWork` 的核心作用是：

1. 对 HostComponent 创建真实 DOM。
2. 对 HostText 创建真实文本节点。
3. 对更新的 HostText 比较新旧文本，必要时打 `Update`。
4. 调用 `bubbleProperties`，把子树 flags 冒泡到父节点。

HostComponent 首次创建 DOM 的逻辑：

```ts
const instance = createInstance(wip.type);
appendAllChild(instance, wip);
wip.stateNode = instance;
```

可以理解为：

```txt
div Fiber complete 时
  创建真实 div DOM
  把下面已经创建好的 span/text DOM 挂到 div 上
```

## 7. subtreeFlags 为什么要冒泡

`bubbleProperties` 会收集子节点上的 flags：

```ts
subtreeFlags |= node.subtreeFlags;
subtreeFlags |= node.flags;
wip.subtreeFlags = subtreeFlags;
```

作用是让父 Fiber 知道：

```txt
我的子树里面有没有需要 commit 的节点？
```

这样 commit 阶段不用每次都盲目遍历整棵树。

它可以通过：

```ts
(finishedWork.subtreeFlags & MutationMask) !== NoFlags
```

快速判断子树里有没有插入、更新、删除。

## 8. commit 阶段：真正操作 DOM

render 阶段只是计算。

commit 阶段才真正修改页面。

入口：

```ts
commitRoot(root)
```

如果根节点或子树存在 mutation flags：

```ts
commitMutationEffects(finishedWork);
```

然后切换树：

```ts
root.current = finishedWork;
```

commit 阶段会处理：

```txt
Placement
  => commitPlacement
  => 找宿主父节点
  => appendPlacementNodeIntoContainer

Update
  => commitUpdate

ChildDeletion
  => commitDeletion
  => 找到要删除的真实 DOM
  => removeChild
```

所以完整职责分工是：

```txt
render 阶段
  计算新的 Fiber 树
  创建离线 DOM
  标记哪些地方需要改

commit 阶段
  根据标记真正改 DOM
  把 finishedWork 切成新的 current
```

## 9. Hooks 是怎么插进这个流程的

函数组件在 `beginWork` 阶段执行：

```ts
updateFuncitonComponent(wip)
  |
  v
renderWithHooks(wip)
```

`renderWithHooks` 会执行函数组件：

```ts
const Component = wip.type;
const child = Component(props);
```

如果组件里有：

```tsx
function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

执行 `Component(props)` 时就会调用 `useState`。

每个 hook 会挂在函数组件 Fiber 的 `menmoizeState` 上，形成单链表：

```txt
FunctionComponent Fiber
  |
  v
menmoizeState
  |
  v
hook1 -> hook2 -> hook3 -> null
```

这两行代码：

```ts
workInProgressHook.next = hook;
workInProgressHook = hook;
```

意思是：

```txt
把新 hook 接到 hook 链表尾部
然后把当前工作指针移动到新 hook
```

## 10. dispatch 更新怎么重新进入主流程

`useState` 初始化时会创建队列：

```ts
const queue = createUpdateQueue<State>();
hook.updateQueue = queue;
```

然后创建 dispatch：

```ts
const dispatcher = dispatcherSetState.bind(
  null,
  currentlyRenderingFibe,
  queue
);
```

当你调用：

```ts
setCount(1)
```

会进入：

```ts
dispatcherSetState(fiber, queue, action)
```

内部执行：

```ts
const update = createUpdate<State>(action);
enqueueUpdate(updateQueue, update);
scheduleUpdateOnFiber(fiber);
```

路线就是：

```txt
setCount(1)
  |
  v
createUpdate(1)
  |
  v
放进 hook.updateQueue.shared.pending
  |
  v
scheduleUpdateOnFiber(functionComponentFiber)
  |
  v
向上找到 HostRoot
  |
  v
renderRoot(root)
  |
  v
重新走 render + commit
```

所以 `dispatch` 不是直接改 DOM，也不是直接改 state。

它只是：

```txt
创建一个 update
放进队列
调度一次从根节点开始的更新
```

## 11. 用一个例子串起来

假设首次渲染：

```tsx
root.render(<App />);
```

大致流程：

```txt
updateContainer(<App />, root)
  |
  |-- 把 <App /> 包成 update
  |-- 放到 HostRoot.updateQueue.shared.pending
  |
scheduleUpdateOnFiber(HostRoot)
  |
renderRoot(root)
  |
createWorkInProgress(root.current, {})
  |
workLoop
  |
  |-- beginWork(HostRoot)
  |   处理 updateQueue，得到 <App />
  |   创建 App 对应的 FunctionComponent Fiber
  |
  |-- beginWork(App Fiber)
  |   renderWithHooks
  |   执行 App 函数
  |   得到 <div>...</div>
  |   创建 div Fiber
  |
  |-- beginWork(div Fiber)
  |   读取 props.children
  |   创建子 Fiber
  |
  |-- completeWork(叶子节点)
  |   创建文本 DOM
  |
  |-- completeWork(div Fiber)
  |   创建 div DOM
  |   把子 DOM 挂到 div DOM
  |   冒泡 flags
  |
  |-- completeWork(App Fiber)
  |   冒泡 flags
  |
  |-- completeWork(HostRoot)
      冒泡 flags
  |
commitRoot(root)
  |
  |-- commitMutationEffects
  |-- root.current = finishedWork
```

## 12. 最重要的心智模型

你可以把这套实现分成三段记：

```txt
第一段：触发更新
  render 或 dispatch
  创建 update
  放进 updateQueue
  scheduleUpdateOnFiber

第二段：render 阶段
  beginWork 向下
    算 children
    创建/复用 Fiber
    做 diff
    打一部分 flags

  completeWork 向上
    创建离线 DOM
    比较文本更新
    冒泡 subtreeFlags

第三段：commit 阶段
  根据 flags 操作真实 DOM
  root.current = finishedWork
```

最短的一句话：

> 更新先进入队列；render 阶段构建新的 workInProgress Fiber 树并收集变化；commit 阶段把变化应用到真实 DOM，然后切换 current 树。

