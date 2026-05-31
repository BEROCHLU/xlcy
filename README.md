# xlcy
<p align="right">
  <strong>English</strong> | <a href="./README_JA.md">日本語</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`xlcy` is a browser-based visualization tool that loads Excel workbooks and displays them as Cytoscape.js network graphs.

Nodes and edges are defined in the Excel `node` / `edge` / `option` sheets. In the browser, you can display graphs, show comments, filter visibility, calculate shortest paths, and save or restore layout JSON files. Sample `.xlsx` / `.json` files for company-specific financial flows and shortest path problems are included in `public/static/uploads/`.

![xlcy screen example 1](.github/image1.png)

![xlcy screen example 2](.github/image2.png)

## Public Site

This application is published on an XREA web server.

[http://pleasecov.g2.xrea.com/xlcy/public/index.php](http://pleasecov.g2.xrea.com/xlcy/public/index.php)

Serve `public/` from a web server that can run PHP. To save layout JSON files on the server, the web server process needs write permission for `public/static/uploads/`.

## Main Features

- Load nodes and edges from Excel `.xlsx` / `.xlsm` files.
- Run left-to-right automatic layout with Cytoscape.js + dagre.
- Specify per-node and per-edge styles using `css.*` columns in Excel.
- Display HTML strings from the `memo` column as Tippy.js comments.
- Toggle visibility by node, edge, or model from Grid.js tables.
- Calculate shortest paths in the visible graph using Dijkstra's algorithm.
- Save and restore layouts by downloading local JSON files.
- Save layout JSON files to `static/uploads/` on the server and automatically restore them when loading an Excel file with the same name.
- Generate a third-party license list.

## Screen Layout

The screen consists of Excel loading controls, a Cytoscape.js graph view, and side-panel detail and filter views.

### Excel Loading

- In `UPLOAD FILE`, select an Excel file placed in `public/static/uploads/` from the dropdown and load it with `Show File`.
- In `LOCAL FILE`, select a local Excel file from `Select and Show File` and load it in the browser without uploading it to the server.
- For uploaded Excel files, if a layout JSON file with the same name exists, it is automatically restored after rendering.

### Graph Operations

- Click a node or edge to show its details and input/output edges in the side panel.
- Drag nodes to change their positions.
- Right-click or two-finger tap an element to toggle its comment display.
- Use `Show All Memos` / `Hide All Memos` to toggle all comments at once.
- Use `All Models` / `All Nodes` / `All Edges` in `TAB 2` to switch the display target.
- Use `all on` / `all off` to show or hide items in bulk by model.
- Use `Calculate Path` to select the Dijkstra shortest path from the selected start node to the selected end node, and display the path and cost.

### Layout Saving

- For uploaded Excel files, `Save Layout` saves the current Cytoscape layout to `public/static/uploads/<Excel file name>.json`.
- For local Excel files, `Save Layout` downloads the layout JSON, and `Restore Layout` loads that JSON.
- During restore, node / edge ID differences between the currently loaded Excel file and the saved JSON are compared, and differences are absorbed with the Excel side taking precedence.

## Data

This app reads the Excel `node`, `edge`, and `option` sheets in the browser and converts them into Cytoscape.js node / edge arrays.

| Item | Description |
| --- | --- |
| Input files | `.xlsx` / `.xlsm` |
| Required sheets | `node` / `edge` / `option` |
| Graph data | Excel `node` / `edge` sheets |
| Global settings | Excel `option` sheet |
| Layout save file | `public/static/uploads/<Excel file name>.json` |
| Sample location | `public/static/uploads/` |
| Image location | `public/static/image/` |

The current `public/static/uploads/` directory includes sample Excel / JSON files for company-specific financial flows and shortest path problems.

Notes:

- `public/index.php` returns the list of Excel files in `uploads` for GET requests to `./index.php/static/uploads`.
- Uploaded Excel file names must be usable as UTF-8.
- Additional columns are generally retained as Cytoscape element `data`, but on-screen tables use fixed columns.
- The `_change` and `_emoji` columns in the samples are memo fields on the data side and are not dedicated features of the current UI.

## Excel Format

The current implementation assumes three sheets: `node`, `edge`, and `option`. Create sheet names in lowercase ASCII.

Even if you do not use values from `option`, it is safer to create an `option` sheet.

### `node` Sheet

This sheet defines nodes. Use the first row as the header and the second and later rows as data.

| Column | Required | Description |
| --- | ---: | --- |
| `label` | Required | Becomes the node ID and display name. Use unique values. |
| `parent` | Optional | Parent node ID for Cytoscape compound nodes. |
| `memo` | Optional | HTML string displayed in the comment popup. |
| `image` | Optional | Image file name inside `public/static/image/`. If specified, it becomes the node background image, and the node size is adjusted to the actual image size. |
| `weight` | Optional | Node cost added to path calculation results. If you use path calculation, enter a number of `0` or greater instead of leaving it blank. |
| `force_show_value` | Optional | If `true`, this node's value is displayed in the label. |
| `col` / `row` | Optional | Metadata for table display. The current rendering process does not use these as initial coordinates. |
| `css.<property>` | Optional | Passed to Cytoscape style using the property name after removing `css.`. |

Node display values are recalculated from connected edge `value` fields after rendering. If there is a sum of incoming edges, that incoming total is used; if the incoming total is `0`, the outgoing edge total is used.

The samples use `css.*` columns such as the following.

```text
css.background-color
css.background-opacity
css.color
css.font-size
css.font-weight
css.height
css.shape
css.width
```

### `edge` Sheet

This sheet defines edges. Use the first row as the header and the second and later rows as data.

| Column | Required | Description |
| --- | ---: | --- |
| `source` | Required | `label` of the source node. |
| `target` | Required | `label` of the target node. |
| `value` | Required | Edge value. Used for line width scaling and, when `weight` is unspecified, as the path calculation cost. |
| `label` | Optional | Label displayed on the edge. |
| `memo` | Optional | HTML string displayed in the comment popup. |
| `model` | Optional | Group name used by the model-level filter in `TAB 2`. |
| `weight` | Optional | Edge cost used in Dijkstra calculation. If unspecified, `value` is used. |
| `curve-style` | Optional | Edge curve style. Used as the initial value after loading. |
| `css.<property>` | Optional | Passed to Cytoscape style using the property name after removing `css.`. |

The samples use `css.*` columns such as the following.

```text
css.color
css.font-size
css.font-weight
css.line-color
css.line-opacity
css.line-style
css.target-arrow-color
css.target-arrow-shape
css.text-margin-x
css.text-margin-y
css.text-opacity
css.width
```

### `option` Sheet

This sheet specifies global settings in one row. Write headers in the first row and values in the second row.

| Column | Default | Description |
| --- | ---: | --- |
| `node_currency` | Empty string | String added before node values. |
| `edge_currency` | Empty string | String added before edge labels. |
| `node_unit` | Empty string | String added after node values. |
| `edge_unit` | Empty string | String added after edge labels. |
| `show_node_value` | `false` | If `true`, values are displayed in labels for all nodes. |
| `use_scale_width` | `false` | If `true`, edge `value` is converted to a width from 2px to 100px on a logarithmic scale. |
| `use_directed` | `true` | If `true`, edge direction is considered during path calculation. |
| `tippy_offset_x` | `0` | X offset for the comment display position. |
| `tippy_offset_y` | `15` | Y offset for the comment display position. |

Some sample files include `use_label_merge` and `avoid_overlap_padding`, but the current JavaScript does not reference them.

### Optional Additional Columns

Columns that do not start with `css.` are generally retained as Cytoscape element `data`. However, on-screen tables use fixed columns, so additional columns may not automatically appear in the UI.

## Style Specification

The `css.<property>` columns in the `node` / `edge` sheets pass only the `<property>` part to Cytoscape style.

Example:

| Excel column | Style passed to Cytoscape |
| --- | --- |
| `css.background-color` | `background-color` |
| `css.font-size` | `font-size` |
| `css.line-color` | `line-color` |
| `css.target-arrow-shape` | `target-arrow-shape` |

See `docs/css-property.md` for a reference list of available properties. Default styles are in `public/static/style/cy-style.json`.

## Path Calculation

Path calculation targets only the currently visible elements. Hidden nodes and edges are excluded from path search.

The edge search cost is `edge.weight`, or `edge.value` if unspecified. After the path is determined, `node.weight` values for nodes on the path are added to the result. If the path passes through a node whose `node.weight` is blank, the result becomes `NaN`; therefore, in Excel files used for path calculation, enter a numeric value of `0` or greater for every node's `weight`.

## Technical Stack

| Purpose | Technology |
| --- | --- |
| Graph rendering | Cytoscape.js |
| Automatic layout | dagre / cytoscape-dagre |
| Excel loading | SheetJS |
| Comment display | Tippy.js / Popper |
| Table display | Grid.js |
| DOM operations, tab switching | jQuery |
| Array and object processing | lodash |
| Date handling | moment |
| Selection UI | Grid.js RowSelection plugin |
| File saving | FileSaver.js |
| Routing, Excel list retrieval, layout JSON saving | PHP |
| Maintenance tasks | Node.js + gulp |

## Directory Structure

```text
.
├── .github/
│   ├── image1.png
│   └── image2.png
├── docs/
│   ├── functions.md
│   ├── cheatsheet.md
│   ├── css-property.md
│   └── memo.txt
├── public/
│   ├── index.php
│   ├── index.html
│   ├── dist/
│   │   ├── bundle.js
│   │   └── LICENSE.txt
│   └── static/
│       ├── css/
│       ├── image/
│       ├── js/
│       ├── licenses/
│       ├── style/
│       └── uploads/
├── gulpfile.js
├── package.json
├── package-lock.json
├── run_Windows.bat
├── README.md
└── README_JA.md
```

Key files:

- `public/index.php`: Lightweight router. Handles Excel list retrieval, layout JSON saving, and displaying `index.html`.
- `public/index.html`: Main app HTML. Loads each library via CDN and `public/dist/bundle.js`.
- `public/dist/bundle.js`: JavaScript bundle generated from `public/static/js/`.
- `public/static/js/workbook-utils.js`: Converts Excel sheets into Cytoscape node / edge arrays.
- `public/static/js/entry.js`: Handles graph rendering, file loading, layout save / restore, and path calculation.
- `public/static/js/gridjs-updater.js`: Handles the side-panel Grid.js tables and visibility toggles.
- `public/static/js/tippy-attach.js`: Creates comment popups from `memo`.
- `public/static/js/server-fetch.js`: Handles Excel list retrieval from the server and layout JSON saving.
- `public/static/js/cytoscape-gestures.js`: Handles helper operations for Cytoscape elements.
- `public/static/js/jqtab.js`: Handles tab switching.
- `public/static/style/cy-style.json`: Default Cytoscape style.
- `public/static/uploads/`: Location for uploaded Excel files and layout JSON files with the same names.
- `gulpfile.js`: Defines gulp tasks for JavaScript bundle generation and license list generation.

## Setup

Node.js builds are not required for normal use. The app works if `public/` can be served by a web server that runs PHP.

Requirements:

- PHP 7.0 or later
- PHP `mbstring` extension
- Write permission for the web server process on `public/static/uploads/`
- Browser that supports ES6 or later
- XAMPP is assumed when using Windows

`npm install` is required only when running maintenance tasks such as `npm run build:js`, `npm run build:js-dev`, or `npm run build:license`.

```bash
npm install
```

## Local Check

If the repository is placed under XAMPP's `htdocs`, open the following URL in a browser.

```text
http://localhost/xlcy/public/
```

On Windows, running `run_Windows.bat` opens the XAMPP Control Panel and opens the URL above in a browser.

## Maintenance

### Regenerate JavaScript Bundle

Combines and minifies JavaScript files in `public/static/js/` in the defined order and updates `public/dist/bundle.js`.

```bash
npm run build:js
```

For a bundle with a source map, run:

```bash
npm run build:js-dev
```

### Regenerate License List

Combines license files under `public/static/licenses/` and updates `public/dist/LICENSE.txt`.

```bash
npm run build:license
```

The concatenation order is defined in `gulpfile.js` as follows.

```text
server-fetch.js
workbook-utils.js
gridjs-updater.js
tippy-attach.js
cytoscape-gestures.js
jqtab.js
entry.js
```

## Troubleshooting

### Excel List Is Not Displayed

- Check that `.xlsx` or `.xlsm` files exist in `public/static/uploads/`.
- Open the app from a URL where PHP executes `public/index.php`.
- Check that file names can be handled as UTF-8.

### Layout Saving Fails

- Check that the web server process has write permission for `public/static/uploads/`.
- Check that a JSON file with the same name is not open in another process.

### Error Occurs During Graph Rendering

- Check that `edge.source` / `edge.target` exactly match `node.label`.
- Check that `node.label` values are not duplicated.
- Check that the sheet names `node`, `edge`, and `option` are lowercase ASCII.
- Check that unnecessary rows or columns that look empty do not still contain formatting or values.

### Path Calculation Result Becomes `NaN`

Nodes on the path may not have `weight` values. In Excel files used for path calculation, enter numeric `weight` values for all nodes.

## Documentation

- `docs/functions.md`: Overview of JavaScript functions
- `docs/cheatsheet.md`: Notes for Cytoscape operations
- `docs/css-property.md`: Reference list of Cytoscape style properties

## License

This repository is licensed under the MIT License. Third-party library licenses are collected in `public/dist/LICENSE.txt`.
