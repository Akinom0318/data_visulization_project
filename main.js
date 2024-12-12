async function loadData(){
    return await d3.csv("income.csv");
}

function processedData(data){
    data.forEach((person) => {
        person["education.num"] = +person["education.num"];
        person.age = +person.age === 17 ? 18 : +person.age;
        person["hours.per.week"] = +person["hours.per.week"];
        person.income = person.income === ">50K" ? true : false;
    });
}

function distributionPlot(data) {
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

    const x = d3.scaleLinear()
        .domain([bins[0].x0, bins[bins.length - 1].x1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(x)
                .tickValues(thresholds)
                .tickFormat(d => `${d}`)
        );

    svg.append("g").call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .style("fill", "#69b3a2");

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

const selectedFeature = "relationship";
// selector function
function barchartPlot(data, selectedFeature) {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
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
    console.log(processedData);

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
        .style("text-anchor", "middle");

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(processedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2");

    svg.selectAll(".label")
        .data(processedData)
        .enter().append("text")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count);
}

function doublecircularbarchartPlot(data){
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 1200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#doublecircularbarchartPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 20)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left + 100 + 100}, ${margin.top + 200})`);

    data = data.filter(d => d["occupation"] !== "?");
    const occupationData = d3.rollup(data, 
        v => ({
            count: v.length,
            avgWorkTime: d3.mean(v, d => d["hours.per.week"])
        }), 
        d => d["occupation"]
    );
    console.log(occupationData);
    
    const innerRadius = 90;
    const outerRadius = Math.min(width, height) / 2 - 40;

    const x = d3.scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    .domain([...occupationData.keys()]);

    const y = d3.scaleRadial()
    .range([innerRadius, outerRadius])
    .domain([0, d3.max(Array.from(occupationData.values()), d => d.count)]);

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
        .innerRadius(d => ybis(d[1].avgWorkTime)) 
        .outerRadius(innerRadius) 
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
    .style("font-size", "11px")
    .attr("alignment-baseline", "middle");
}


document.addEventListener("DOMContentLoaded", async function(){
    const data = await loadData();
    processedData(data);
    console.log(data);
    distributionPlot(data);
    barchartPlot(data, selectedFeature);
    doublecircularbarchartPlot(data);
});