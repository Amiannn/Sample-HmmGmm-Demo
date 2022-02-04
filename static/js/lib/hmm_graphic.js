export function getGraphic(iframe, div_id) {
  var cygraphic = cytoscape({
    container: document.getElementById(iframe).contentWindow.document.getElementById(div_id),
  
    boxSelectionEnabled: false,
    autounselectify: true,
  
    style: cytoscape.stylesheet()
      .selector('node')
        .style({
          'content': 'data(id)'
        })
      .selector('.emission')
        .style({
          'shape': 'polygon',
          'shape-polygon-points': [-0.5, -1, 0.5, -1, 0, 1],
          'background-color': '#61bffc',
          'height': 80,
          'width' : 100,
          'opacity': 0.05,
          'content': ''
        })
      .selector('edge')
        .style({
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'width': 4,
          'content': 'data(weight)',
          'line-color': '#ddd',
          'target-arrow-color': '#ddd',
          'opacity': 'data(opacity)'
        })
      .selector('.highlighted')
        .style({
          'background-color': '#61bffc',
          'line-color': '#61bffc',
          'target-arrow-color': '#61bffc',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': '0.2s',
          'opacity': 1
        }),
  });

  return cygraphic;
}

export function getViterbiGraphic(iframe, div_id) {
  var cygraphic = cytoscape({
    container: document.getElementById(iframe).contentWindow.document.getElementById(div_id),
  
    boxSelectionEnabled: false,
    autounselectify: true,
  
    style: cytoscape.stylesheet()
      .selector('node')
        .style({
          'width'  : 5,
          'height' : 5,
          'content': 'data(name)',
          'background-color': 'data(color)',
          'opacity': 'data(opacity)'
        })
      .selector('.emission')
        .style({
          'shape': 'polygon',
          'shape-polygon-points': [-0.5, -1, 0.5, -1, 0, 1],
          'background-color': '#61bffc',
          'height': 80,
          'width' : 100,
          'opacity': 0.05,
          'content': ''
        })
      .selector('edge')
        .style({
          // 'curve-style': 'bezier',
          // 'target-arrow-shape': 'triangle',
          // 'width': 1,
          'line-color': '#999',
          // 'target-arrow-color': '#ddd',
          'width': 'data(opacity)',
          'opacity': 0.5
        })
      .selector('.highlighted')
        .style({
          'background-color': '#61bffc',
          'line-color': '#61bffc',
          // 'target-arrow-color': '#61bffc',
          'transition-property': 'background-color, line-color, target-arrow-color',
          // 'transition-duration': '0.1s',
          'width' : 5,
          'height': 5,
          'opacity': 1
        })
        .selector('.passed')
        .style({
          'background-color': '#61bffc',
          'line-color': '#61bffc',
          // 'target-arrow-color': '#61bffc',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': '0.2s',
          'width' : 3,
          'height': 3,
          'opacity': 0.3
        })
        .selector('.done')
        .style({
          'background-color': '#b23a48',
          'line-color': '#b23a48',
          // 'target-arrow-color': '#61bffc',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': '0.5s',
          'width' : 5,
          'height': 5,
          'opacity': 0.8
        }),
  });

  return cygraphic;
}

export function drawViterbi(cygraphic, data) {
  var viterbi_data = data.data.viterbi;
  var delta        = viterbi_data.delta;
  var bp_matrix    = viterbi_data.bp_matrix;
  console.log(bp_matrix);
  // normalize delta
  for(let t = 0;t < delta.length; t++) {
    for(let i = 0;i < delta[t].length; i++) {
      var min =  Infinity;
      var max = -Infinity;
      for(let j = 0;j < delta[t][i].length; j++) {
        var value = parseFloat(delta[t][i][j]);
        delta[t][i][j] = value;
        if(value == -Infinity) continue;

        if(value < min) min = value;
        if(value > max) max = value;
      }


      for(let j = 0;j < delta[t][i].length; j++) {
        var value = parseFloat(delta[t][i][j]);
        if(value == -Infinity) continue;

        delta[t][i][j] = (value - min) / (2 * (max - min)) + 0.5;
        if (isNaN(delta[t][i][j])) {
          delta[t][i][j] = 1; 
        } 
      }
      // console.log(max);
      // console.log(min);
    }
  }
  console.log(delta);
  // clear
  cygraphic.elements().remove()

  // draw viterbi
  var nodes = [];
  var edges = [];

  // draw time line
  for(let t = 0;t < delta.length; t++) {
      var name = 't' + (t + 1);
      var opacity = 0.5;
      var color = '#FFFFFF'

      nodes.push({
        group: 'nodes',
        data: { 
          id: 'T_' + t,
          name: name,
          opacity: opacity,
          color: color
        },
        position: {x: 50 + t * 45, y: 70}
      });
  }

  // draw state line
  for(let i = 0;i < delta[0].length; i++) {
    var name = 's' + i;
    var opacity = 0.5;
    var color = '#FFFFFF'

    nodes.push({
      group: 'nodes',
      data: { 
        id: 'SS_' + i,
        name: name,
        opacity: opacity,
        color: color
      },
      position: {x: 27, y: 90 + i * 45}
    });
}


  for(let t = 0;t < delta.length; t++) {
    for(let i = 0;i < delta[t].length; i++){
      var name    = '';
      var opacity = 1;
      var color   = '#999';

      nodes.push({
        group: 'nodes',
        data: { 
          id: 'S' + i + '_' + t,
          name: name,
          opacity: opacity,
          color: color
        },
        position: {x: 50 + t * 45, y: 80 + i * 45}
      });
  
      if(t > 0) {
        // draw edge
        for(let j = 0;j < delta[t][i].length; j++){
          
          var weight = delta[t][i][j];
          if(weight == -Infinity) continue;

          edges.push({
            group: 'edges',
            data: {
              id: 'e' + i + '_' + j + '_' + t,
              weight: 1,
              opacity: 1,
              source: 'S' + j + '_' + (t - 1),
              target: 'S' + i + '_' + t 
            }
          });
        }
      }
    }
  }
  // console.log(edges);
  cygraphic.add(nodes);
  cygraphic.add(edges);
  
  display_viterbi_train(viterbi_data);

  function display_viterbi_train(viterbi_data) {
    var delta = viterbi_data.delta;
    var display_sequence = [];
    var index = 0;

    // create display sequence
    for(let t = 0;t < delta.length; t++) {
        for(let i = 0;i < delta[t].length; i++) {
          for(let j = 0;j < delta[i].length; j++) {
                var value = parseFloat(delta[t][i][j]);
                if (value == -Infinity) continue;
                //'S' + i + '_' + t
                //'e' + i + '_' + j + '_' + t
                display_sequence.push(backtracking(t, i));
            }
        }
    }

    function backtracking(t, i) {
      var backtrack_sequence = [];

      for(let k = t;k >= 0; k--) {
        // console.log(`t: ${ t }, i: ${ i }`)
        // console.log(i);
        var tmp = parseInt(bp_matrix[i][k]);
        backtrack_sequence.push([`#S${ i }_${k}`, k, i, 0]);
        backtrack_sequence.push([`#e${ i }_${ tmp }_${ k }`, k, tmp, i]);
        i = tmp;
      }
      // console.log('----');
      return backtrack_sequence;
    }
    // console.log(display_sequence);
    // console.log(demoCygraphic);
    function viterbiDisplay() {
        // if(index >= display_sequence.length) clearTimeout(display_viterbi_timer);

        if(index > 0 && index < display_sequence.length) {
          var last_sequence = display_sequence[index - 1];
          last_sequence.forEach(last => {
            cygraphic.$(last[0]).removeClass('highlighted');
            cygraphic.$(last[0]).addClass('passed');
          });
        }

        if(index == display_sequence.length - 1) {
          var last_sequence = display_sequence[index - 1];
          last_sequence.forEach(last => {
            cygraphic.$(last[0]).removeClass('highlighted');
            cygraphic.$(last[0]).removeClass('passed');
            cygraphic.$(last[0]).addClass('done');
          });
          clearTimeout(display_viterbi_timer);
          return;
        }

        var now_sequence = display_sequence[index];
        
        now_sequence.forEach(now => {
            cygraphic.$(now[0]).removeClass('passed');
            cygraphic.$(now[0]).addClass('highlighted');
        });

        
        index += 1;
        // console.log(now);
    }
    clearTimeout(display_viterbi_timer);
    display_viterbi_timer = setInterval(viterbiDisplay, 25);
  }
}

var display_viterbi_timer = null;

function drawHmm(cygraphic, data) {
  // clear
  cygraphic.elements().remove()

  var transitions = data.data.transitions;

  // draw transition
  var nodes = [];
  var emiss = [];
  var edges = [];
  for(let i = 0;i < transitions.length; i++){
    nodes.push({
      group: 'nodes',
      data: { id: 'S' + i},
      position: {x: 200 + i * 200, y: 120}
    });

    emiss.push({
      group: 'nodes',
      data: { id: 'M' + i},
      position: {x: 200 + i * 200, y: 25}
    });

    // draw edge
    for(let j = 0;j < transitions[i].length; j++){
      
      var weight = Math.round(transitions[i][j] * 100) / 100;
      var op = 0.1 + weight * 0.9;
      if(weight == 0) op = 0;
      
      edges.push({
        group: 'edges',
        data: {
          id: 'e' + i + '_' + j,
          weight: weight,
          opacity: op,
          source: 'S' + i,
          target: 'S' + j
        }
      });
    }
  }

  cygraphic.add(nodes);
  cygraphic.add(emiss);
  cygraphic.add(edges);

  for(let i = 0;i < transitions.length; i++) {
    cygraphic.$(`#M${ i }`).addClass('emission');
  }
}


export function hmm_graphic_init(data, cygraphic) {
  drawHmm(cygraphic, data);
}


// var bfs = cygraphic.elements().bfs('#a', function(){}, true);

//   var i = 0;
//   var highlightNextEle = function(){
//     if( i < bfs.path.length ){
//       bfs.path[i].addClass('highlighted');
  
//       i++;
//       setTimeout(highlightNextEle, 1000);
//     }
//   };
  
//   // kick off first highlight
//   highlightNextEle();