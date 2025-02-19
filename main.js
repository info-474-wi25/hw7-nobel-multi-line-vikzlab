// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
  // Relevant columns:
  // - fullname -> name (y variable)
  // - year (x variable)
  // - category (color variable)

  // 2.a: REFORMAT DATA
  data.forEach(d => {
      d.year = +d.year;       // Convert year to a number
      d.name = d.fullname;    // Rename column for clarity
  });
  console.log("Raw Data:", data);
  console.log("Years:", data.map(d => d.year));

  // 3: PREPARE DATA
  // 3.a: Categorize data into STEM and Non-STEM
  const stemCategories = ["chemistry", "physics", "medicine"];
  const categorizedData = data.map(d => ({
      ...d, 
      categoryGroup: stemCategories.includes(d.category) ? "STEM" : "Non-STEM"
  }));
  console.log(categorizedData);

  console.log("STEM vs. Non-STEM:", categorizedData.slice(0, 5).map(d => ({
      category: d.category,
      categoryGroup: d.categoryGroup
  })));

  // 3.b: Group data by categoryGroup and year, and count entries
  // Use d3.rollup to create a nested data structure
  const categories = d3.rollup(
    categorizedData,
    v => d3.rollup(
      v,
      values => values.length,
      d => d.year
    ),
    d => d.categoryGroup
  );

  // 4: SET SCALES
  const allYears = Array.from(categories.values())
      .flatMap(yearMap => Array.from(yearMap.keys()));

  const yearCounts = Array.from(categories.values())
      .map(categoryMap => Array.from(categoryMap.values()));
  const maxCount = d3.max(yearCounts, yearValues => d3.max(yearValues));

  // 4.a: Define xScale for years using d3.scaleLinear
  const xScale = d3.scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, width]);

  // 4.b: Define yScale based on the max count of laureates
  const yScale = d3.scaleLinear()
      .domain([0, maxCount + 1])
      .range([height, 0]);

  // 4.c: Define colorScale using d3.scaleOrdinal
  const colorScale = d3.scaleOrdinal()
      .domain(Array.from(categories.keys()))
      .range(d3.schemeCategory10);

  // 4.d: Line generator
  const line = d3.line()
    .x(d => xScale(d.year))   // Use xScale instead of XScale
    .y(d => yScale(d.count)); // Use yScale instead of YScale

  // 5: PLOT LINES
  const dataArray = Array.from(categories.entries());
  
  svgLine.selectAll("path")
    .data(dataArray)
    .enter()
    .append("path")
    .attr("d", d => {
      // d is [categoryGroup, Map(year => count)]
      const yearMap = d[1];
      const values = Array.from(yearMap.entries())
        .map(([year, count]) => ({ year, count }));
      return line(values);
    })
    .style("stroke", d => colorScale(d[0]))
    .style("fill", "none")
    .style("stroke-width", 2);

  // 6: ADD AXES
  // 6.a: X-AXIS
  svgLine.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));  

  // 6.b: Y-AXIS
  svgLine.append("g")
    .call(d3.axisLeft(yScale));

  // 7: ADD LABELS
  // 7.a: Title
  svgLine.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .text("Nobel Laureates Trends: STEM vs Non-STEM")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  // 7.b: X-axis label
  svgLine.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Year");

  // 7.c: Y-axis label
  svgLine.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Number of Laureates");

  // 8: LEGEND
  const legend = svgLine.selectAll(".legend")
    .data(Array.from(categories.entries()))
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width - 150}, ${i * 20 - 30})`);

  legend.append("rect")
    .attr("x", 10)
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", d => colorScale(d[0]));

  legend.append("text")
    .attr("x", 30)
    .attr("y", 10)
    .style("alignment-baseline", "middle")
    .text(d => d[0]);
});
