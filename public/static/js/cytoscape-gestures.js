'use strict';
/**
 * Define a function called addTapListener that listens for tap events on nodes and edges in the cytoscape graph.
 */
function addTapListener() {
    // When a node is tapped, update the contents of the three grids with information about the node and its incoming and outgoing edges.
    cy.on('tap', 'node', (evt) => { //Node left-click tap event
        const node = evt.target;
        //node_edge.innerHTML = "Node";

        let arrGirdNode = [];
        let arrGridIN = [];
        let arrGridOUT = [];

        // Add the data for the tapped node to the arrGirdNode array.
        arrGirdNode.push(node.data());

        // For each incoming edge of the node, if it is visible, add its data to the arrGridIN array.
        node.incomers('edge').forEach(ed => {
            if (ed.css('visibility') === 'visible') {
                arrGridIN.push(ed.data());
            }
        });

        // For each outgoing edge of the node, if it is visible, add its data to the arrGridOUT array.
        node.outgoers('edge').forEach(ed => {
            if (ed.css('visibility') === 'visible') {
                arrGridOUT.push(ed.data());
            }
        });

        // Update the configuration of the gridelem grid to display the data in arrGirdNode.
        gridelem.updateConfig({
            columns: ["label",
                "col",
                "row",
                "value"
            ],
            data: arrGirdNode,
            style: {
                th: {
                    'padding': '5px',
                    'text-align': 'center'
                },
                td: {
                    'padding': '5px',
                    'text-align': 'center'
                }
            }
        }).forceRender();

        // Update the configuration of the gridin grid to display the data in arrGridIN.
        gridin.updateConfig({
            columns: ["label",
                "model",
                "value",
                "source",
                "target",
                "id"
            ],
            data: arrGridIN,
            style: {
                th: {
                    'padding': '5px',
                    'text-align': 'center'
                },
                td: {
                    'padding': '5px',
                    'text-align': 'center'
                }
            }
        }).forceRender();

        // Update the configuration of the gridout grid to display the data in arrGridOUT.
        gridout.updateConfig({
            columns: ["label",
                "model",
                "value",
                "source",
                "target",
                "id"
            ],
            data: arrGridOUT,
            style: {
                th: {
                    'padding': '5px',
                    'text-align': 'center'
                },
                td: {
                    'padding': '5px',
                    'text-align': 'center'
                }
            }
        }).forceRender();
    }); // left click node

    // When an edge is tapped, update the contents of the gridelem grid with information about the edge and clear the contents of the gridin and gridout grids.
    cy.on('tap', 'edge', (evt) => { //Edge left-click tap event
        const edge = evt.target;
        let arrGirdEdge = [];
        //node_edge.innerHTML = "Edge";
        // Add the data for the tapped edge to the arrGirdEdge array.
        arrGirdEdge.push(edge.data());

        // Update the configuration of the gridelem grid to display the data in arrGirdEdge.
        gridelem.updateConfig({
            columns: ["label",
                "model",
                "value",
                "source",
                "target",
                "id"
            ],
            data: arrGirdEdge,
            style: {
                th: {
                    'padding': '5px',
                    'text-align': 'center'
                },
                td: {
                    'padding': '5px',
                    'text-align': 'center'
                }
            }
        }).forceRender();

        // Clear the contents of the gridin and gridout grids.
        gridin.updateConfig({
            columns: ["0"],
            data: [" "]
        }).forceRender();
        gridout.updateConfig({
            columns: ["0"],
            data: [" "]
        }).forceRender();
    }); // left click edge
}
/**
 * Define a function called addCxtTapListener that listens for right-click and two-finger tap events on nodes and edges in a Cytoscape graph.
 */
function addCxtTapListener() {
    cy.on('cxttap', 'node', (evt) => {
        const node = evt.target;
        const strElementID = node.data('elemid');
        const tippyThis = window.hshTippy[strElementID];
        toggleTippy(tippyThis); // Calls the toggleTippy function with the tooltip associated with this node
    });

    cy.on('cxttap', 'edge', (evt) => {
        const edge = evt.target;
        const strElementID = edge.data('elemid');
        const tippyThis = window.hshTippy[strElementID];
        toggleTippy(tippyThis); // Calls the toggleTippy function with the tooltip associated with this edge
    });
}