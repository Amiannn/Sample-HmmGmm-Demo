var colors = [
    'rgb(31, 119, 180)', 
    'rgb(255, 127, 14)', 
    'rgb(44, 160, 44)', 
    'rgb(214, 39, 40)', 
    'rgb(150, 103, 189)'
];

export function plotDemoTrain(id, datas, names) {
    var traces = [];
    var b = 0;
    for(let i = 0;i < datas.length; i++) {
        var x = [];
        for(let t = 0;t < datas[i].length; t++) {
            x.push(t + b);
        }
        b += datas[i].length
        traces.push({
            x: x,
            y: datas[i],
            type: 'scatter',
            name: `state ${ i }`,
            marker: {
                opacity: 0.1,
            },
            line: {
                color: colors[i % colors.length]
            }
        });  
        
        // traces.push({
        //     x: x,
        //     y: datas[i],
        //     mode: 'markers',
        //     name: `state ${ i }`,
        //     marker: {
        //         opacity: 0.5,
        //         color: colors[i % colors.length],
        //         size: 5
        //     },
        // });
    }
    Plotly.newPlot(id, traces);
}