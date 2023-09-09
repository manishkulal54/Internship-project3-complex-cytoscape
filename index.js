const graphContainer = document.getElementById("graphContainer")
const fileAcceptor = document.getElementById("fileAcceptor")
const convertBtn = document.getElementById("convertBtn")
const changeClr = document.getElementById("changeClr")
const changeSize = document.getElementById("changeSize")
const changeFontSize = document.getElementById("changeFontSize")
const changeRootName = document.getElementById("changeRootName")


let fileUrl = ""
let svgFileName = ""
let sheetIndex = 0

let rootSize = 40
let boxSize = 15
let siteRadius = 1
let svgSize = 3



let colors = {
    pathClr: "#555",
    UDDUClr: "blue",
    UUDDClr: "green",
    bothClr: "red",
    root: "purple"
}

const fontSizes = {
    rootFontSize: 17,
    complexFontSize: 10,
    geneFontSize: 8,
    siteFontSize: 8
}

let frequencyArr = []
let rootText = "root"

function defaultValueLoader() { //setting the default values to the input fields
    document.getElementById("clrInpt1").value = "#595A6E"
    document.getElementById("clrInpt2").value = "#4391DB"
    document.getElementById("clrInpt3").value = "#15E523"
    document.getElementById("clrInpt4").value = "#E50606"

    document.getElementById("number1").value = 30
    document.getElementById("number2").value = 15
    document.getElementById("number3").value = 1
    document.getElementById("number4").value = 3


    document.getElementById("fsize1").value = 17
    document.getElementById("fsize2").value = 10
    document.getElementById("fsize3").value = 8
    document.getElementById("fsize4").value = 8
}
defaultValueLoader()

// getting the file metadata from the user selected file
convertBtn.addEventListener("click", (e) => {
    e.preventDefault()
    const fileInputBtn = document.getElementById("fileInputBtn")
    sheetIndex = document.getElementById("sheetIndexInpt").value - 1

    if (sheetIndex < 0) {
        return alert("Sheet number starts from 1 or above!!!!")
    }
    const file = fileInputBtn.files[0]
    if (!file) {
        return fileInputBtn.click()
    }
    svgFileName = file.name.split(".")[0]
    const acceptedFormat = ["xlsx", "xls"]
    const fileExtension = file.name.split(".").pop()

    if (acceptedFormat.includes(fileExtension.toLowerCase())) {
        fileUrl = URL.createObjectURL(file)
        fileAcceptor.style.display = "none"
        graphContainer.style.display = "block"
        fetchFileData(fileUrl, sheetIndex)

    } else {
        alert("Select only excel file")
        window.location.reload()
    }
})

changeClr.addEventListener("click", (e) => {
    e.preventDefault()
    colors.pathClr = document.getElementById("clrInpt1").value || "#555"
    colors.UDDUClr = document.getElementById("clrInpt2").value || "blue"
    colors.UUDDClr = document.getElementById("clrInpt3").value || "green"
    colors.bothClr = document.getElementById("clrInpt4").value || "red"

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})


changeSize.addEventListener("click", (e) => {
    e.preventDefault()
    rootSize = parseInt(document.getElementById("number1").value)
    boxSize = parseInt(document.getElementById("number2").value)
    siteRadius = parseInt(document.getElementById("number3").value)
    svgSize = parseInt(document.getElementById("number4").value)

    if (rootSize < 1 || boxSize < 1 || siteRadius < 1 || svgSize < 1) {
        return alert("Size value must be more than zero !!!!")
    }

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})

changeFontSize.addEventListener("click", (e) => {
    e.preventDefault()
    fontSizes.rootFontSize = parseInt(document.getElementById("fsize1").value) || 17
    fontSizes.complexFontSize = parseInt(document.getElementById("fsize2").value) || 10
    fontSizes.geneFontSize = parseInt(document.getElementById("fsize3").value) || 8
    fontSizes.siteFontSize = parseInt(document.getElementById("fsize4").value) || 8

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})
changeRootName.addEventListener("click", e => {
    e.preventDefault()
    rootText = document.getElementById("rootInput").value || "root"

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})


// fetchFileData("COMPLEX_new data.xlsx", 0)

//fetching the data from the file and preprocessing the data 
function fetchFileData(fileUrl, sheetIndex) {

    fetch(fileUrl)
        .then(res => res.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[sheetIndex]
            if (!sheetName) {
                alert("There is no sheet found using this sheet number try again")
                window.location.reload()
            }
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

            const root = {
                name: rootText,
                children: [],
                code: "root"
            };

            const complexMap = new Map() //container for the complexes
            const indexObj = {} //container for the indexes
            let index = 0
            sheetData.forEach(row => {
                console.log(row);
                let codeArr = row.code.split("+");
                let code = codeArr[0];
                let complex = codeArr[1];
                if (!complexMap.has(complex)) {
                    const complexNode = {
                        name: complex,
                        children: [],
                        code
                    }
                    complexMap.set(complex, complexNode)
                    root.children.push(complexNode)
                    indexObj[complex] = index;
                    index++
                }
            })

            const geneObj = {} //container for the gene
            sheetData.forEach(row => {
                let codeArr = row.code.split("+");
                let code = codeArr[0];
                let complex = codeArr[1];
                let geneName = row.genes;
                const complexNode = complexMap.get(complex)
                if (!(`${complex}-${geneName}` in geneObj)) {
                    geneObj[`${complex}-${geneName}`] = true //complex-genename:true format
                    const geneNode = {
                        name: geneName,
                        children: [],
                        code
                    }
                    complexNode.children.push(geneNode)
                }
            })


            let sitesObj = {} //continer for the sites
            sheetData.forEach(row => {
                let codeArr = row.code.split("+");
                let code = codeArr[0];
                let complex = codeArr[1];
                let geneName = row.genes;
                let siteName = row.sites;
                let frequency = row.Frequency
                root.children[indexObj[complex]].children.forEach(gn => {
                    if (gn.name === geneName) {
                        if (!(`${complex}-${geneName}-${siteName}-${code}` in sitesObj)) {
                            sitesObj[`${complex}-${geneName}-${siteName}-${code}`] = true //complex-genename-sitename:true format
                            const siteNode = {
                                name: siteName,
                                code,
                                frequency,
                                children: [{ name: true }]
                            }
                            gn.children.push(siteNode)
                            frequencyArr.push(frequency)
                        }
                    }
                })
            })
            drawChart(root)
        })
        .catch(err => {
            console.error("Error Found !!!", err);
            alert("Error found :", " Check your input file with names (genes,sites,code,Frequency) also match the case")
        })
}

// converting the chart from the data 
function drawChart(data) {
    const width = 1200;
    const cx = width * 0.5
    const radius = width / 2 - 50 * svgSize;

    const svg = d3
        .select("#chart") //selecting the svg with id chart
        .attr("viewBox", [-cx, -cx, width, width])
        .style("border", "2px solid red")
        .attr("style", "width:100%;height:auto;")

    const tree = d3
        .tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

    //creating the data in the tree form and data is in ascending order 
    const root = tree(d3
        .hierarchy(data)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name))
    )


    // plotting paths 
    svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke", colors.pathClr)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 0.75)
        .selectAll()
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => {
                if (d.depth === 4 && !d.children) {
                    return d.y - 100 + ((d.parent.data.frequency / Math.min(...frequencyArr)) * siteRadius)
                }
                return d.y
            }))

    //creating the rectangles and circles
    svg
        .append("g")
        .selectAll()
        .data(root.descendants())
        .join(function (e) {
            const node = e.append("g")
            node.filter(d => d.depth === 3) //creating the circles at depth=3(outer circle)
                .append("circle")
                .attr("r", d => d.data.frequency / Math.min(...frequencyArr) + siteRadius)
                .attr("fill", d => colorForSites(d))
                .attr("stroke", "black")
                .attr("stroke-width", ".7px")
                .call(d3.drag() //drag handling
                    .on("start", dragStarted)
                    .on("drag", draggingCircle)
                    .on("end", dragEnded)
                )
            node.filter(d => d.children && d.depth !== 3) //creating rectagles where the node must have children and it should not in outer circle 
                .append("rect")
                .attr("x", d => d.depth === 0 ? -(rootSize / 2) : -15)
                .attr("y", d => d.depth === 0 ? -(rootSize / 2) : 0 - (boxSize / 2))
                .attr("width", d => d.depth === 0 ? rootSize : boxSize)
                .attr("height", d => d.depth === 0 ? rootSize : boxSize)
                .attr("fill", d => colorForGenes(d))
                .attr("stroke", "black")
                .attr("stroke-width", "1px")
            return node
        })
        .attr("transform", d => alignShapes(d))


    // color for sites 
    function colorForSites(d) {
        if (d.data.code == "UUDD") {
            return colors.UUDDClr
        }
        else if (d.data.code == "UDDU") {
            return colors.UDDUClr
        }
    }

    //dragging functions 
    function dragStarted() {
        d3.select(this).raise().classed("active", true);
    }
    function draggingCircle(d) { //drag controls
        d3.select(this) //adjust the values as required
            .attr("transform", `rotate(${90}) translate(${d.x >= Math.PI ? d3.event.y - (490 - 50 * svgSize) : d3.event.y - (490 - 50 * svgSize)},${-d3.event.x})`)
    }
    function dragEnded() {
        d3.select(this).classed("active", false);
    }


    //aligning the shapes based on the depth
    function alignShapes(d) {
        if (d.depth === 0) {
            return `rotate(${0}) translate(${d.y},0)`
        }
        else if (d.depth === 1) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 10},0)`
        }
        else if (d.depth === 2) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 15},0)`
        }
        else if (d.depth === 3) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
        }
    }

    // assigning colors for the gene
    function colorForGenes(d) {
        if (d.data.code == "root") {
            return colors.root
        }
        let found = {
            1: false,
            2: false
        }
        let color = ""
        d.children.forEach(e => {
            if (e.data.code === "UDDU") {
                found[1] = true
            } else if (e.data.code === "UUDD") {
                found[2] = true
            }
            if (found[1] == true && found[2] == true) {
                color = colors.bothClr
            }
            else if (found[1] == true || found[2] == true) {
                if (d.data.code == "UUDD") {
                    color = colors.UUDDClr
                }
                else if (d.data.code == "UDDU") {
                    color = colors.UDDUClr
                }
            }
        })
        return color
    }


    // plotting the text
    svg
        .append("g")
        .selectAll()
        .data(root.descendants())
        .join("text")
        .attr("transform", d => alignText(d))
        .style("font-size", d => fontSize(d))
        .style("font-weight", "bold")
        .attr("dy", "0.1em")
        .text(d => {
            if (!(d.depth === 4 && !d.children)) {
                return d.data.name
            }
        })


    // alinging the text according to depth
    function alignText(d) {
        if (d.depth === 0) {
            return `rotate(${0})
                    translate(${d.x - (rootSize / 2)},${d.y})
                    `
        }

        else if (d.depth === 1 && d.children) {
            return `rotate(${d.x * 180 / Math.PI - 90})
                    translate(${d.x >= Math.PI ? (d.y + 12 + boxSize + 30) : (d.y - 6 + boxSize)},0) 
                    rotate(${d.x >= Math.PI ? 180 : 0})
                    `
        }
        else if (d.depth === 2 && d.children) {
            return `rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.x >= Math.PI ? (d.y + boxSize + fontSizes.geneFontSize * 4) : (d.y + boxSize + fontSizes.geneFontSize)},${d.x >= Math.PI ? -1 : 1}) 
                rotate(${d.x >= Math.PI ? 180 : 0})
            `
        }
        else if (d.depth === 3 && d.children) {
            return `rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.x >= Math.PI ? (d.y + 40 + (d.data.frequency / Math.min(...frequencyArr) * siteRadius)) : (d.y + 20 + (d.data.frequency / Math.min(...frequencyArr) * siteRadius))},${d.x >= Math.PI ? -1.5 : 1.5}) 
                rotate(${d.x >= Math.PI ? 180 : 0})
            `
        }
    }

// fontsize for the different nodes 
    function fontSize(d) {
        if (d.depth === 0) {
            return fontSizes.rootFontSize
        }
        else if (d.depth === 1 && d.children) {
            return fontSizes.complexFontSize
        }
        else if (d.depth === 2 && d.children) {
            return fontSizes.geneFontSize
        }
        else if (d.depth === 3 && d.children) {
            return fontSizes.siteFontSize
        }
    }

}

// downloading the svg by converting into it
const svgElement = document.querySelector("#chart");
const downloadButton = document.querySelector("#downloadButton");

downloadButton.addEventListener("click", () => { //converting into svg on download button click
    const svgContent = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = svgFileName
    link.click();
});

// editBtn handling
const editingBtns = document.getElementById("editingBtns")

editingBtns.onclick = () => {
    const editBtn = document.getElementById("editBtn")
    const closeBtn = document.getElementById("closeBtn")
    const optionsContainer = document.getElementById("optionsContainer")
    if (editBtn.style.display !== "none") {
        editBtn.style.display = "none"
        closeBtn.style.display = "flex"
        optionsContainer.style.display = "flex"
    } else {
        editBtn.style.display = "flex"
        closeBtn.style.display = "none"
        optionsContainer.style.display = "none"
    }
}


