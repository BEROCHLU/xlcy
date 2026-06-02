# JavaScript 関数概要

このドキュメントは、`public/static/js/` 配下の JavaScript が担当している処理をファイル別・機能別にまとめたものです。実装の入口は `public/index.html` で、次の順序で読み込まれます。

```text
server-fetch.js
workbook-utils.js
gridjs-updater.js
tippy-attach.js
cytoscape-gestures.js
jqtab.js
entry.js
```

## グローバル状態

### `window.cy`

Cytoscape.js のインスタンスです。`entry.js` で `null` として初期化され、`drawCytoscape()` の中で生成されます。ブラウザのコンソールから状態確認やデバッグをしやすくするために `window` に置いています。

### `window.hshTippy`

Tippy.js インスタンスを `elemid` ごとに保持する連想配列です。`cyCreateTippy()` で登録され、`destroyAllTippy()` で破棄・初期化されます。

### `strExcelName`

現在読み込んでいる Excel ファイル名から拡張子を除いた値です。ローカル配置 JSON の保存名などに使います。

### `workbook`

SheetJS で読み込んだ Excel workbook オブジェクトです。

### option 由来の設定値

`workbook-utils.js` では、`option` シートの 1 行目から次の値を読み取り、グローバル変数として保持します。

| 変数 | 読み取り元 |
|---|---|
| `NODE_CURRENCY` | `node_currency` |
| `EDGE_CURRENCY` | `edge_currency` |
| `NODE_UNIT` | `node_unit` |
| `EDGE_UNIT` | `edge_unit` |
| `SHOW_NODE_VALUE` | `show_node_value` |
| `USE_SCALE_WIDTH` | `use_scale_width` |
| `TIPPY_OFFSET_X` | `tippy_offset_x` |
| `TIPPY_OFFSET_Y` | `tippy_offset_y` |
| `USE_DIRECTED` | `use_directed` |

## `server-fetch.js`

### `syncGetExcelList()`

`./index.php/static/uploads` に GET リクエストを送り、サーバー上の `.xlsx` / `.xlsm` 一覧を取得します。取得したファイル名は昇順にソートして `#xlsx_file` の `<select>` に追加します。

レスポンスがエラーの場合は JSON の `error` を読んで例外化し、最終的にコンソールへ出力します。

## `workbook-utils.js`

### `workbookToArrays(workbook)`

SheetJS の workbook から `node`、`edge`、`option` シートを読み取り、Cytoscape.js に渡せる node / edge 配列へ変換します。

主な処理は次のとおりです。

- `option` シートから表示単位、線幅スケール、コメント位置、経路計算の有向設定を読み取る
- `node` シート各行に `id = label` と `elemid = n<index>` を付与する
- `edge` シート各行に `id = e<index>` と `elemid = e<index>` を付与する
- `css.` で始まる列を `style` オブジェクトへ移し、`data` からは除外する
- `node.label` の重複を検出した場合に alert を出す

戻り値は `[collecNode, collecEdge]` です。各要素は `{ data, style }` の形になります。

### `logScaleValue(value, from, to)`

指定値を対数スケールで変換します。現在は `USE_SCALE_WIDTH` が true のとき、エッジの `value` を `[2, 100]` の線幅へ変換するために使います。

`from` と `to` はそれぞれ `[min, max]` 形式の配列です。

## `gridjs-updater.js`

このファイルでは、サイドパネル of リストの Grid.js テーブルを初期化し、表示・非表示の同期処理を定義しています。

### Grid インスタンス

| 変数 | 表示先 | 役割 |
|---|---|---|
| `gridelem` | `#grid_node` | クリックしたノードまたはエッジの詳細 |
| `gridin` | `#grid_in` | クリックしたノードへの入力エッジ |
| `gridout` | `#grid_out` | クリックしたノードからの出力エッジ |
| `gridModel` | `#grid_model` | モデル一覧と表示切り替え |
| `gridNodesAll` | `#grid_nodeall` | 全ノード一覧と表示切り替え |
| `gridEdgesAll` | `#grid_edgeall` | 全エッジ一覧と表示切り替え |

### `gridForceUpdate(arrGirdNodeAll, arrGirdEdgeAll, arrGridEdgeModel)`

描画済み Cytoscape 要素から作った配列を使い、モデル・全ノード・全エッジの Grid.js テーブルを再構成します。

各テーブルのチェックボックスには Grid.js の `RowSelection` plugin を使います。再読み込み時にイベントが重複しないよう、`ready` イベントは一度 `off()` してから `on()` し直します。

### `addModelEventReady()`

モデル一覧テーブルのチェック状態変更を監視します。

チェックされたモデルに属するエッジを表示し、外れたモデルに属するエッジを非表示にします。その後、接続している visible エッジがあるノードだけを表示し、対応するノード・エッジ一覧のチェックボックスも同期します。親ノードと孤立ノードはこの処理から除外されます。

### `addNodesEventReady()`

全ノード一覧テーブルのチェック状態変更を監視し、親ノード以外のノードの `visibility` を切り替えます。

### `addEdgesEventReady()`

全エッジ一覧テーブルのチェック状態変更を監視し、各エッジの `visibility` を切り替えます。

### `toggleClickGridNode(strNodeid, isVisible)`

指定ノードに対応する `#grid_nodeall` の行を探し、チェック状態が `isVisible` と一致しない場合だけ checkbox の click を発火します。

Grid.js の selection state を外部から直接書き換えるのではなく、UI の click と同じ経路で同期するための補助関数です。

### `toggleClickGridEdge(strEdgeid, isVisible)`

指定エッジに対応する `#grid_edgeall` の行を探し、チェック状態が `isVisible` と一致しない場合だけ checkbox の click を発火します。

### `toggleClickModelsAll(isAllChecked)`

`#grid_model` の全行を走査し、モデル checkbox を一括で ON または OFF にします。

## `tippy-attach.js`

### `cyCreateTippy()`

現在の Cytoscape 要素を走査し、`memo` を持つノード・エッジに Tippy.js のツールチップを作成します。作成した Tippy インスタンスは `window.hshTippy[elemid]` に保存します。

### `makeTippy(cyId, strMemo, strelemid)`

Cytoscape 要素の `popperRef()` を基準位置として、手動表示の Tippy インスタンスを作ります。

`strMemo` は HTML として `div.innerHTML` に入ります。位置補正には `TIPPY_OFFSET_X` と `TIPPY_OFFSET_Y` を使います。

### `destroyAllTippy()`

`window.hshTippy` に入っている Tippy インスタンスをすべて `destroy()` し、連想配列を空に戻します。Excel 再読み込み時の古いツールチップを消すために使います。

### `showAllTippy()`

`window.hshTippy` に入っている Tippy インスタンスをすべて表示します。Excel 読み込み後にも自動実行されます。

### `toggleTippy(tippyThis)`

指定された Tippy インスタンスが表示中なら隠し、非表示なら表示します。右クリックまたは 2 本指タップ時に使います。

## `cytoscape-gestures.js`

### `addTapListener()`

Cytoscape の `tap` イベントをノードとエッジに登録します。

ノードをタップした場合は、そのノードの `data`、visible な入力エッジ、visible な出力エッジを `gridelem`、`gridin`、`gridout` に表示します。

エッジをタップした場合は、そのエッジの `data` を `gridelem` に表示し、`gridin` と `gridout` は空表示に戻します。

### `addCxtTapListener()`

Cytoscape の `cxttap` イベントをノードとエッジに登録します。対象要素の `elemid` から `window.hshTippy` を引き、対応するコメントを `toggleTippy()` で開閉します。

## `jqtab.js`

### タブ切り替え click ハンドラー

`ul.tab-of-list > li` の click を監視し、クリックされたタブに `active-tab`、対応する `#panel_group > div` に `active-panel` を付けます。

既存の active クラスは毎回削除されます。

## `entry.js`

アプリ本体の初期化、ファイル読み込み、Cytoscape 描画、配置保存・復元、経路計算、UI イベントを扱います。

### `drawCytoscape(collecNode, collecEdge)`

`#cy` に Cytoscape インスタンスを生成します。

主な設定は次のとおりです。

- layout は `dagre`
- `rankDir` は `LR`
- `maxZoom` は `5`
- `minZoom` は `1 / 25`
- style は `./static/style/cy-style.json` から fetch
- elements は `workbookToArrays()` で生成した node / edge

生成後、`cy.ready()` 内で `readyInCytoscape()` を実行します。初期化に失敗した場合は `handleCytoscapeError()` を呼び、Promise を reject します。

### `handleCytoscapeError(error)`

Cytoscape 初期化時のエラーを alert と console に出します。メッセージでは、ノードとエッジの不一致を確認するよう案内します。

### `readyInCytoscape()`

Cytoscape 描画後の後処理です。

ノード側では、親ノードを除外して次の処理を行います。

- ラベルを `data.label` に設定
- `image` がある場合は `./static/image/<image>` を読み込み、画像サイズに合わせてノードサイズと背景画像を設定
- `image` がない場合は `background-image` を `none` に設定
- 入力エッジ合計を `data.value` に設定
- 入力合計が `0` の場合は出力エッジ合計を `data.value` に設定
- `SHOW_NODE_VALUE` または `force_show_value === true` の場合、ノード値をラベルに追記

エッジ側では、次の処理を行います。

- `EDGE_CURRENCY`、`data.label`、`EDGE_UNIT` からラベルを設定
- `data.curve-style` を `curve-style` に設定
- `USE_SCALE_WIDTH` が true の場合、`data.value` を対数スケールで線幅へ反映
- モデル一覧、全エッジ一覧用の配列を作成

最後に `addTapListener()`、`addCxtTapListener()`、`gridForceUpdate()` を呼びます。

### `appendOption()`

経路計算用の `#lt_start` と `#lt_end` の選択肢を作り直します。既存 option と `.lt-unit` をクリアし、親ノード以外のすべての node ID を始点・終点候補として追加します。

### `beginDrawCytoscape(file, isServer = false)`

Excel ファイルまたは fetch response を受け取り、グラフ表示までの一連の処理を行います。

処理の流れは次のとおりです。

1. `file.arrayBuffer()` を SheetJS で読み込む
2. `node`、`edge`、`option` シートを対象に workbook を作る
3. `workbookToArrays()` で Cytoscape 用配列へ変換する
4. `drawCytoscape()` で描画する
5. 既存 Tippy を破棄し、経路計算 option と Tippy を作り直す
6. 読み込みファイル名を `strExcelName` に保持する
7. エッジ表示方法 select を `bezier` に戻す
8. `isServer` が true の場合、同名 JSON があれば自動復元する
9. 最後に全コメントを表示する

### `syncGetMeta(url)`

画像 URL を読み込み、`Image` オブジェクトを Promise で返します。ノード背景画像の自然幅・自然高さを取得するために使います。

読み込みに失敗した場合は console に出力し、例外を再 throw します。

### `fixJsonDifferences(objRemote)`

保存済み配置 JSON と、現在の Cytoscape 要素の ID 差分を調整します。

実装上は現在読み込んでいる Excel 側を優先します。

- JSON 側にだけ存在する node / edge は `objRemote` から削除する
- 現在の Excel 側にだけ存在する node / edge は、`data.id` だけを持つ要素として `objRemote` に追加する

この処理は、古い配置 JSON を新しい Excel に適用するときに `cy.json(objFix)` が壊れにくくするためのものです。新規追加された要素に座標を計算して付ける処理ではありません。

### `fixParentPosition()`

配置保存前に Cytoscape JSON を縮約します。

保存対象は、node の `data.id` と `position`、edge の `data.id` だけです。親ノードは子ノードから範囲が決まるため、親ノードの `position` は削除します。

戻り値は次の形です。

```json
{
  "elements": {
    "nodes": [],
    "edges": []
  }
}
```

## `entry.js` のイベントハンドラー

### `#show_demo` click

`SERVER FILES` の選択値から `./static/uploads/<filename>` を fetch し、成功したら `beginDrawCytoscape(file, true)` を呼びます。リモート読み込みなので、同名 JSON があれば描画後に自動復元されます。

### `#upload_json` click

現在の配置を `fixParentPosition()` で保存用 JSON にし、`./index.php/static` へ `FormData` で POST します。ファイル名は `<選択中Excel名>.json` です。

### `#fetch_json` click

`./static/uploads/<選択中Excel名>.json` を fetch し、`fixJsonDifferences()` を通してから `cy.json()` で配置を復元します。

### `#edge_type` change

現在の全エッジの `curve-style` を select の値に変更します。

### `window` load

`syncGetExcelList()` でリモート Excel 一覧を作ります。

ホスト名が `127.0.0.1` の場合はメニューを開き、1 秒後に `#show_demo` を click します。その後、`localStorage.inputText` があれば `#xlsx_file` の値に反映します。

### `.button-menu` click

`nav` の `open-menu` クラスを切り替え、ボタン文言を `Menu` / `Close` に切り替えます。

### `.show-tippy` click

`showAllTippy()` を呼び、全コメントを表示します。

### `.hide-tippy` click

`tippy.hideAll()` を呼び、全コメントを非表示にします。

### `#input_xlsx` change

ローカルファイルを読み込み、`beginDrawCytoscape(file, false)` を呼びます。読み込み後は status 表示を更新し、同じファイルを連続選択できるよう input を空に戻します。

### `#download_json` click

現在の配置を `fixParentPosition()` で保存用 JSON にし、FileSaver.js の `saveAs()` でローカルに保存します。ファイル名は `<Excel名>_<HHmm>.json` です。

### `#restore_json` change

ローカル JSON を読み込み、`fixJsonDifferences()` を通してから `cy.json()` で配置を復元します。読み込み後は input を空に戻します。

### `.lt` click

経路計算を実行します。

現在 visible な要素だけを対象に `cyFiltered.dijkstra()` を実行し、`#lt_start` から `#lt_end` までの経路を選択状態にします。エッジの探索コストは `weight`、未指定なら `value`、どちらもなければ `0` です。

`distanceTo()` の結果に、経路上の node の `weight` を加算して `.lt-unit` に表示します。経路の node label と edge label / edge id は `#textarea_path` に出力します。

### `#click_allon` / `#click_alloff` click

モデル一覧のチェックボックスを全 ON / 全 OFF にします。内部では `toggleClickModelsAll(true|false)` を呼びます。

### `.save-button` click

現在の `#xlsx_file` の選択値を `localStorage.inputText` に保存します。次回ロード時、`window` load ハンドラーでこの値を select に戻します。
