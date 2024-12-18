async function loadData(){
    return await d3.csv("income.csv");
}

function processedData(data){
    data.forEach((person) => {
        person.age = +person.age === 17 ? 18 : +person.age;
        person["hours.per.week"] = +person["hours.per.week"];
        person.income = person.income === ">50K" ? true : false;
    });
}

let selected_feature_value = null;
function distributionPlot(data) {
    function updateLabel(type, value) {
        const id = `income-${type}-value`;
        document.getElementById(id).textContent = value + '%';
    }

    if(selected_feature_value != null){
        data = data.filter(d => d[selectedFeature] === selected_feature_value);
    }

    let total = data.length;
    let greater_50k = data.filter(d => d.income === true).length;
    let less_50k = data.filter(d => d.income === false).length;
    let greater_50k_percent = (greater_50k / total) * 100;
    let less_50k_percent = (less_50k / total) * 100;

    updateLabel("true", greater_50k_percent.toFixed(2));
    updateLabel("false", less_50k_percent.toFixed(2));

    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 1200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#distributionPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 20)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left + 100}, ${margin.top})`);

    const minAge = d3.min(data, d => d.age);
    const maxAge = d3.max(data, d => d.age);
    const binWidth = 2;
    const thresholds = d3.range(minAge, maxAge + binWidth, binWidth);

    const histogram = d3.histogram()
        .value(d => d.age)
        .domain([minAge, maxAge])
        .thresholds(thresholds);

    const bins = histogram(data);

    bins.forEach(bin => {
        bin.trueCount = bin.filter(d => d.income === true).length;
        bin.falseCount = bin.filter(d => d.income === false).length;
    });

    const x = d3.scaleLinear()
        .domain([bins[0].x0, bins[bins.length - 1].x1])
        .range([0, width]);

        const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.trueCount + d.falseCount) || 1])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(x)
                .tickValues(thresholds)
                .tickFormat(d => `${d}`)
        );

    svg.append("g").call(d3.axisLeft(y));

    svg.selectAll(".bar-false")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar-false")
    .attr("x", d => x(d.x0))
    .attr("y", height)
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", 0)
    .style("fill", "red")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.falseCount)) 
    .attr("height", d => height - y(d.falseCount)); 

    svg.selectAll(".bar-true")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar-true")
    .attr("x", d => x(d.x0))
    .attr("y", height)
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", 0)
    .style("fill", "green")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.falseCount + d.trueCount)) 
    .attr("height", d => y(d.falseCount) - y(d.falseCount + d.trueCount));

    const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("start brush", brushed); 

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        const selection = event.selection;
        if (selection) {
            const [x0, x1] = selection;
            const selectedBins = bins.filter(d => {
                const binLeft = x(d.x0);
                const binRight = x(d.x1);
                return (binLeft >= x0 && binLeft <= x1) || (binRight >= x0 && binRight <= x1);
            });

            svg.selectAll(".bar-false")
                .style("fill", function (d) {
                    return selectedBins.includes(d) ? "orange" : "red";
                });
            svg.selectAll(".bar-true")
                .style("fill", function (d) {
                    return selectedBins.includes(d) ? "lightgreen" : "green";
                });

            let total_bins = [];
            selectedBins.forEach(bin => {
                total_bins = total_bins.concat(bin);
            });
            let selected_greater_50k = total_bins.filter(d => d.income === true).length;
            let selected_less_50k = total_bins.filter(d => d.income === false).length;
            updateLabel("true", ((selected_greater_50k / total) * 100).toFixed(2));
            updateLabel("false", ((selected_less_50k / total) * 100).toFixed(2));
            if (total_bins.length === 0) {
                updateLabel("true", greater_50k_percent.toFixed(2));
                updateLabel("false", less_50k_percent.toFixed(2));
            }
        }
    }

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Age");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("Numbers of People");
}


let selectedFeature = "sex";
function barchartPlot(data, selectedFeature) {
    const margin = { top: 30, right: 100, bottom: 30, left: 60 },
        width = 1200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#barchartPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 20)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left + 100}, ${margin.top})`);

    const groupedData = d3.rollup(
        data,
        v => v.length,
        d => d[selectedFeature]
    );

    const processedData = Array.from(groupedData, ([key, count]) => ({
        key: key, 
        count: count 
    }));
    processedData.sort((a, b) => a.key - b.key);
    //console.log(processedData);

    const x = d3.scaleBand()
        .domain(processedData.map(d => d.key))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "11px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "15px");

    svg.selectAll(".bar")
        .data(processedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#69b3a2")
        .style("cursor", "pointer")
        .style("stroke", "none")
        .style("stroke-width", "2px")
        .on("click", function(event, d) {
            svg.selectAll(".bar")
            .style("stroke", "none")
            .style("stroke-width", "2px");
            d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", "4px");
            selected_feature_value = d.key;
            doublecircularbarchartPlot(data, d.key)
            d3.select("#doublecircularbarchartPlot").select("svg").remove()
            distributionPlot(data.filter(data => data[selectedFeature] === d.key));
            d3.select("#distributionPlot").select("svg").remove()
        })
        .transition()
            .duration(1000)
            .attr("y", d => y(d.count)) 
            .attr("height", d => height - y(d.count));

    svg.selectAll(".label")
        .data(processedData)
        .enter().append("text")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count)
}

const selectedKey = null;
function doublecircularbarchartPlot(data, selectedKey){
    //console.log(selectedKey, selectedFeature);
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 500 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#doublecircularbarchartPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 20)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left + 100 + 100}, ${margin.top + 200})`);

    if (selectedKey != null) {
        data = data.filter(d => d[selectedFeature] == selectedKey);
    }
    data = data.filter(d => d["occupation"] !== "?");
    const occupationData = d3.rollup(data, 
        v => ({
            count: v.length,
            avgWorkTime: d3.mean(v, d => d["hours.per.week"])
        }), 
        d => d["occupation"]
    );
    console.log(occupationData);
    
    const innerRadius = 100;
    const outerRadius = Math.min(width, height)-200;

    const x = d3.scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    .domain([...occupationData.keys()]);

    const y = d3.scaleRadial()
    .range([innerRadius, outerRadius])
    .domain([0, d3.max(Array.from(occupationData.values()), d => d.count)]);
    console.log(y.domain());

    const ybis = d3.scaleRadial()
    .range([innerRadius, innerRadius-50])
    .domain([0, d3.max(Array.from(occupationData.values()), d => d.avgWorkTime)]);

    // outer circle
    svg.append("g")
    .selectAll("path")
    .data(Array.from(occupationData.entries()))
    .join("path")
    .attr("fill", "#69b3a2")
    .attr("d", d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius+1) 
        .startAngle(d => x(d[0]))
        .endAngle(d => x(d[0]) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius))
    .style("cursor", "pointer")
    .on("click", (event, d) => {
        distributionPlot(data.filter(data => data["occupation"] === d[0]));
        d3.select("#distributionPlot").select("svg").remove()
    })
    .transition()
    .duration(1000)
    .attr("d", d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(d => y(d[1].count)) 
        .startAngle(d => x(d[0]))
        .endAngle(d => x(d[0]) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius));


    // inner circle
    svg.append("g")
    .selectAll("path")
    .data(Array.from(occupationData.entries()))
    .join("path")
    .attr("fill", "red")
    .attr("d", d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius-1)
        .startAngle(d => x(d[0]))
        .endAngle(d => x(d[0]) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius))
    .style("cursor", "pointer")
    .on("click", (event, d) => {
        distributionPlot(data.filter(data => data["occupation"] === d[0]));
        d3.select("#distributionPlot").select("svg").remove()

    })
    .transition()  // 啟用過渡動畫
    .duration(1000)  // 設定動畫持續時間
    .attr("d", d3.arc()
        .innerRadius(innerRadius)  // 內圓半徑不變
        .outerRadius(d => ybis(d[1].avgWorkTime))  // 動態改變外圓半徑
        .startAngle(d => x(d[0]))
        .endAngle(d => x(d[0]) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius));

    svg.append("g")
    .selectAll("g")
    .data(Array.from(occupationData.entries()))
    .join("g")
    .attr("text-anchor", function(d) {
        return (x(d[0]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start";
    })
    .attr("transform", function(d) {
        return "rotate(" + ((x(d[0]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" +
            "translate(" + (ybis(d[1].avgWorkTime) + 10) + ",0)";
    })
    .append("text")
    .text(d => d[0])  // occupation name
    .attr("transform", function(d) {
        return (x(d[0]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)";
    })
    .style("font-size", "13px")
    .style("user-select","none")
    .attr("alignment-baseline", "middle");
}


document.addEventListener("DOMContentLoaded", async function(){
    const data = await loadData();
    processedData(data);
    console.log(data);
    distributionPlot(data);
    barchartPlot(data, selectedFeature);
    doublecircularbarchartPlot(data, selectedKey);

    const selector = document.getElementById("selector");
    selector.addEventListener("change", function(event){
        selectedFeature = event.target.value;
        d3.select("#barchartPlot").select("svg").remove();
        barchartPlot(data, selectedFeature);
        d3.select("#doublecircularbarchartPlot").select("svg").remove();
        doublecircularbarchartPlot(data, selectedKey);
        d3.select("#distributionPlot").select("svg").remove();
        selected_feature_value = null;
        distributionPlot(data);
    });
});
