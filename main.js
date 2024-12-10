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




document.addEventListener("DOMContentLoaded", async function(){
    const data = await loadData();
    processedData(data);
    console.log(data);
    distributionPlot(data);
});