# Cytoscape API チートシート

このメモは、`xlcy` をブラウザで開いた状態で DevTools の Console から `cy` を操作・確認するための例です。

`cy` は `public/static/js/entry.js` で `window.cy` として公開されています。Excel を読み込んでグラフが表示された後に使ってください。

## 基本確認

### 全要素数を確認する

```js
cy.nodes().length;
cy.edges().length;
cy.elements().length;
```

### 全ノード・全エッジの ID を表示する

```js
cy.nodes().forEach(node => console.log(node.data('id')));
cy.edges().forEach(edge => console.log(edge.data('id')));
```

ノードとエッジをまとめて見る場合:

```js
cy.elements().forEach(ele => {
  console.log(ele.isNode() ? 'node' : 'edge', ele.data('id'));
});
```

## 要素を取得する

### ID で取得する

英数字だけの ID なら `#id` 形式で取得できます。

```js
cy.$('#n12');
```

日本語や記号を含む ID は、属性セレクターを使う方が安全です。

```js
cy.$("[id='ノードA']");
cy.nodes("[id='サンプルノード1']");
```

### ラベルでノードを探す

このアプリでは `node.label` が `node.id` にコピーされます。通常は `id` で探せます。

```js
cy.nodes("[id='ノードA']");
```

複数条件で探したい場合:

```js
cy.nodes().filter(node => node.data('label')?.includes('ノード'));
```

## data を見る

### 選択した要素の data を見る

```js
cy.$(':selected').forEach(ele => console.log(ele.data()));
```

### 特定ノードの data を見る

```js
cy.$("[id='ノードA']").data();
cy.$("[id='ノードA']").data('value');
```

### 全ノードの主要 data を表で見る

```js
console.table(
  cy.nodes().map(node => ({
    id: node.data('id'),
    label: node.data('label'),
    value: node.data('value'),
    parent: node.data('parent'),
    weight: node.data('weight')
  }))
);
```

### 全エッジの主要 data を表で見る

```js
console.table(
  cy.edges().map(edge => ({
    id: edge.data('id'),
    label: edge.data('label'),
    source: edge.data('source'),
    target: edge.data('target'),
    value: edge.data('value'),
    weight: edge.data('weight'),
    model: edge.data('model')
  }))
);
```

## 接続関係を見る

### ノードに入ってくるエッジを見る

```js
const node = cy.$("[id='ノードA']");
node.incomers('edge').forEach(edge => console.log(edge.data()));
```

### ノードから出ていくエッジを見る

```js
const node = cy.$("[id='ノードA']");
node.outgoers('edge').forEach(edge => console.log(edge.data()));
```

### 接続している全エッジを見る

```js
cy.$("[id='ノードA']")
  .connectedEdges()
  .forEach(edge => console.log(edge.data('id'), edge.data('source'), '->', edge.data('target')));
```

### 前後のノードを調べる

```js
const node = cy.$("[id='ノードA']");

node.predecessors('node').forEach(n => console.log('前:', n.data('id')));
node.successors('node').forEach(n => console.log('後:', n.data('id')));
```

## style を見る・変える

### 選択した要素の style を見る

```js
cy.$(':selected').forEach(ele => console.log(ele.style()));
```

### 特定ノードの style を見る

```js
cy.$("[id='ノードA']").style();
cy.$("[id='ノードA']").style('background-color');
```

### 一時的に色を変える

```js
cy.$("[id='ノードA']").style({
  'background-color': '#ff0000',
  'color': '#ffffff'
});
```

### エッジの表示方法を一括変更する

```js
cy.edges().style('curve-style', 'straight');
cy.edges().style('curve-style', 'bezier');
cy.edges().style('curve-style', 'taxi');
```

## 表示・選択を操作する

### 要素を選択する

```js
cy.elements().unselect();
cy.$("[id='ノードA']").select();
```

### connectedEdges もまとめて選択する

```js
const node = cy.$("[id='ノードA']");
cy.elements().unselect();
node.union(node.connectedEdges()).select();
```

### 表示・非表示を切り替える

このアプリの UI は `visibility` を使っているため、Console でも同じプロパティを使うと挙動を追いやすいです。

```js
cy.$("[id='ノードA']").style('visibility', 'hidden');
cy.$("[id='ノードA']").style('visibility', 'visible');
```

特定 model のエッジを非表示にする例:

```js
cy.edges()
  .filter(edge => edge.data('model') === 'グループA')
  .style('visibility', 'hidden');
```

## レイアウトを試す

### 現在の layout options を確認する

```js
cy.layout({ name: 'grid' }).options;
```

### 一時的に grid レイアウトへ並べる

```js
cy.layout({ name: 'grid' }).run();
```

### dagre レイアウトを再実行する

```js
cy.layout({
  name: 'dagre',
  rankDir: 'LR',
  nodeSep: 180,
  edgeSep: 120,
  rankSep: 200
}).run();
```

## 位置情報・JSON を見る

### ノード座標を表で見る

```js
console.table(
  cy.nodes().map(node => ({
    id: node.data('id'),
    x: node.position('x'),
    y: node.position('y')
  }))
);
```

### Cytoscape JSON を見る

```js
cy.json();
```

保存対象に近い形で見る場合:

```js
({
  elements: {
    nodes: cy.nodes().map(node => ({
      data: { id: node.data('id') },
      position: node.position()
    })),
    edges: cy.edges().map(edge => ({
      data: { id: edge.data('id') }
    }))
  }
});
```

## 経路探索を試す

### Dijkstra を Console から実行する

```js
const startId = 'スタート';
const endId = 'ゴール';

const visibleElements = cy.elements().filter(ele => ele.css('visibility') === 'visible');
const dijkstra = visibleElements.dijkstra({
  root: `[id='${startId}']`,
  weight: ele => ele.data('weight') ?? ele.data('value') ?? 0,
  directed: true
});

const path = dijkstra.pathTo(cy.nodes(`[id='${endId}']`));
cy.elements().unselect();
path.select();

console.log('distance:', dijkstra.distanceTo(cy.nodes(`[id='${endId}']`)));
path.forEach(ele => console.log(ele.isNode() ? 'node' : 'edge', ele.data('label'), ele.data('id')));
```

`option.use_directed` が false のデータでは `directed: false` に変えて確認してください。

## よくある注意点

- 日本語 ID、空白、記号を含む ID は `cy.$("[id='...']")` のように属性セレクターで取得する。
- `display: none` ではなく `visibility: hidden` を使うと、このアプリの Grid.js 表示切り替えと合わせやすい。
- `cy.nodes().data()` はコレクション先頭要素の data だけを見る用途になりやすい。全件確認は `forEach()` や `map()` を使う。
- Console で変更した style や layout は一時的な変更。Excel 再読み込みや JSON 復元で上書きされる。
