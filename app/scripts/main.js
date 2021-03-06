$(function(){

  var nodes = {};
  var routesTable = {};
  var selectedNode1;

  var Node = function(id) {
    this.x = Math.floor((document.width-document.width*0.2) * Math.random() + document.width*0.1);
    this.y = Math.floor((document.height-document.height*0.2) * Math.random() + document.height*0.1);
    this.id = id;
    this.neighbors = [];
  };

  Node.prototype.findNeighbors = function() {

    var makeNeighbors = function(node1, node2) {
      if (node1.neighbors.indexOf(node2) === -1) {
        node1.neighbors.push(node2);
      }
      if (node2.neighbors.indexOf(node1) === -1) {
        node2.neighbors.push(node1);
      }

      var routeKey = Math.min(node1.id, node2.id) + "-" + Math.max(node1.id, node2.id);
      routesTable[routeKey] = [node1, node2];
    };

    for (var key in nodes) {
      var chance = Math.random();
      var screenSize = Math.sqrt(document.width*document.height);

      if (nodes[key] !== this) {
        if (Math.abs(this.x-nodes[key].x)+Math.abs(this.y-nodes[key].y) < screenSize*0.03 && chance < 0.6) {
          makeNeighbors(this, nodes[key]);
        } else if (Math.abs(this.x-nodes[key].x)+Math.abs(this.y-nodes[key].y) < screenSize*0.05 && chance < 0.4) {
          makeNeighbors(this, nodes[key]);
        } else if (Math.abs(this.x-nodes[key].x)+Math.abs(this.y-nodes[key].y) < screenSize*0.08 && chance < 0.3) {
          makeNeighbors(this, nodes[key]);
        } else if (Math.abs(this.x-nodes[key].x)+Math.abs(this.y-nodes[key].y) < screenSize*0.12 && chance < 0.2) {
          makeNeighbors(this, nodes[key]);
        }
      }
    }


  };

  Node.prototype.createDomNode = function(key) {
    $('<div>')
    // .text(key)
    .addClass('node')
    .attr('id', key)
    .css({"left": this.x+5+"px", "top": this.y+5+"px"})
    .click(toggleSelectedNode)
    .appendTo('body');
  }

  var createGraph = function() {
    var numNodes = parseInt(window.location.hash.substring(1)) || 300;
    for (var i = 0; i < numNodes; i++) {
      nodes[i] = new Node(i);
    }

    for (var key in nodes) {
      nodes[key].findNeighbors();
      nodes[key].createDomNode(key);
    }

    var routes = [];
    for (var key in routesTable) {
      routes.push(createPathSegment(routesTable[key][0], routesTable[key][1], 'route'));
    }
    $('body').append(routes);
  };

  var findShortestPath = function(curNode, endNode) {
    var openNodes = [curNode];

    while (openNodes.length > 0) {

      // Sort nodes so we're always working from the current best path option
      openNodes.sort(function(a,b) {
        return b.totalCost - a.totalCost;
      });

      curNode = openNodes.pop();
      curNode.visited = true;

      if (curNode === endNode) {
        console.log('path found!');

        var pathNodes = [endNode];
        while (curNode.parent) {
          pathNodes.push(curNode.parent);
          curNode = curNode.parent;
        }
        createSolutionPath(pathNodes);
        return resetGraph();
      }

      for (var i = 0; i < curNode.neighbors.length; i++) {
        var neighbor = curNode.neighbors[i];

        if (!neighbor.visited && openNodes.indexOf(neighbor) === -1) { // If neighbor isn't in openNodes, add it
          neighbor.parent = curNode;
          neighbor.costFromParent = calcPathCost(curNode, neighbor);
          neighbor.costToEnd = calcPathCost(neighbor, endNode);
          neighbor.totalCost = neighbor.costFromParent + neighbor.costToEnd;
          openNodes.push(neighbor);
        } else if (!neighbor.visited) { // If neighbor is already in openNodes, compare cost from curNode and replace parent if path is better
          var costFromParent = calcPathCost(curNode, neighbor);
          var costToEnd = calcPathCost(neighbor, endNode);
          var totalCostFromCurNode = costFromParent + costToEnd;

          if (totalCostFromCurNode < neighbor.totalCost) {
            neighbor.parent = curNode;
            neighbor.costFromParent = costFromParent;
            neighbor.costToEnd = costToEnd;
            neighbor.totalCost = totalCostFromCurNode;
          }
        }
      }
    }

    console.log("no path found");
    resetGraph();
  };

  var calcPathCost = function(node1, node2) {
    return Math.sqrt((node1.x-node2.x)*(node1.x-node2.x)+(node1.y-node2.y)*(node1.y-node2.y))
  }

  var createSolutionPath = function(pathNodes) {
    createPathSegment(pathNodes.pop(), pathNodes[pathNodes.length-1], 'solution');
    if (pathNodes.length > 1) {
      setTimeout(function() {
        createSolutionPath(pathNodes);
      }, 250);
    }
  };

  var createPathSegment = function(node1, node2, pathClass) {
    var x1 = node1.x;
    var y1 = node1.y;
    var x2 = node2.x;
    var y2 = node2.y;

    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var transform = 'rotate('+angle+'deg)';

    var path = $('<div>');

    if (pathClass === 'solution') {
      path.appendTo('body')
    }

    path.addClass('path')
        .addClass(pathClass)
        .css({'transform': transform})
        .width(length)
        .offset({left: x1+10, top: y1+10});

    return path;
  };

  var resetGraph = function() {
    // $('.solution').remove();
    for (var key in nodes) {
      var node = nodes[key];
      delete node.parent;
      delete node.costFromParent;
      delete node.costToEnd;
      delete node.totalCost;
      delete node.visited;
    }
  }

  var toggleSelectedNode = function(event) {
    var id = event.target.id;
    if (!selectedNode1) {
      selectedNode1 = nodes[event.target.id];
    } else if (selectedNode1 && selectedNode1 !== nodes[event.target.id]) {
      // Handle two nodes selected
      var selectedNode2 = nodes[event.target.id];
      findShortestPath(selectedNode1, selectedNode2);
      // Set node back to undefined after finding path
      selectedNode1 = undefined;
    } else {
      selectedNode1 = undefined;
    }
  };

  createGraph();
});