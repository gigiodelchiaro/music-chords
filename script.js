const gridHeight = 6;
const gridWidth = 6;
class Chord {
    constructor(name, shape, essential, exclude = []) {
        this.name = name;
        this.shape = shape;
        this.essential = essential;
        this.exclude = exclude;
    }
}

let chords = [];

let chordDict = {};
document.getElementById('fileInput').addEventListener('change', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file first.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const jsonContent = JSON.parse(event.target.result);
            chords = jsonContent.chords.map(chordData => new Chord(
                chordData.name, 
                chordData.shape,
                chordData.essential,
                chordData.exclude
            ));
            chordDict = chords.reduce((dict, chord) => {
                dict[chord.name] = new Chord(chord.name, chord.shape, chord.essential, chord.exclude);
                return dict;
            }, {});

            // Update input values based on style attribute
            if (jsonContent.style) {
                document.getElementById('cellWidth').value = jsonContent.style.cellWidth;
                document.getElementById('cellHeight').value = jsonContent.style.cellHeight;
                document.getElementById('radius').value = jsonContent.style.radius;
                document.getElementById('stroke').value = jsonContent.style.stoke;
                document.getElementById('smallRadius').value = jsonContent.style.smallRadius;
            }
        } catch (e) {
            alert("Error parsing JSON file.");
            console.error(e);
        }
    };
    reader.readAsText(file);
});
function update_css(cellWidth, cellHeight, stroke, smallRadius, radius) {    // Create or select the style element in the head to update
    let styleElement = document.getElementById('dynamicStyles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamicStyles';
        document.head.appendChild(styleElement);
    }

    // Generate CSS dynamically
    let styles = `
        svg {
            width: ${(gridWidth - 1) * (cellWidth) + 2 * (radius)}px;
            height: ${(gridHeight - 1) * (cellHeight) + radius + 2*smallRadius}px;
        }
        .lineY {
            stroke-width: ${stroke}px;
        }
        .lineX {
            stroke-width: ${stroke}px;
        }
        .lineX[index="0"] {
            stroke-width: ${5 * stroke}px;
        }
        .line-round {
            stroke-width: ${radius};
        }
        .small {
            r: ${smallRadius}px;
            stroke-width: ${stroke}px;
            cy: ${(gridHeight - 1) * cellHeight + radius}px;
        }
        .big {
            r: ${radius - stroke}px;
        }
        .finger {
            font-size: ${2*radius - 2*stroke}px;
        }
    `;
    
    const yLines = document.querySelectorAll('.lineY');
    yLines.forEach((lineY) => {
        const index = parseInt(lineY.getAttribute('index')) || 0;
        const xPos = index * cellWidth + radius;
        lineY.setAttribute('x1', `${xPos}px`);
        lineY.setAttribute('x2', `${xPos}px`);
        lineY.setAttribute('y1', '0px');
        lineY.setAttribute('y2', `${(gridHeight - 1) * cellHeight + stroke/2}px`);
    });

    // Update X lines
    const xLines = document.querySelectorAll('.lineX');
    xLines.forEach((lineX) => {
        const index = parseInt(lineX.getAttribute('index')) || 0;
        const yPos = index * cellHeight;
        lineX.setAttribute('y1', `${yPos}px`);
        lineX.setAttribute('y2', `${yPos}px`);
        lineX.setAttribute('x1', `${radius}px`);
        lineX.setAttribute('x2', `${(gridWidth - 1) * cellWidth + radius}px`);
    });
    const roundLines = document.querySelectorAll('.line-round');
    roundLines.forEach((lineR) => {
        const x1 = parseInt(lineR.getAttribute('x_coord1'));
        const x2 = parseInt(lineR.getAttribute('x_coord2'));
        const yPos = parseInt(lineR.getAttribute('y_coord') - 1) * cellHeight + cellHeight / 2;
        lineR.setAttribute('x1', (gridWidth - x1 + 1) * cellWidth - radius);
        lineR.setAttribute('x2', (gridWidth - x2) * cellWidth);
        lineR.setAttribute('y1', yPos);
        lineR.setAttribute('y2', yPos);
    });
    // Update circles and finger text positions
    for (let x = 0; x < gridWidth; x++) {
        const cx = (gridWidth - x - 1) * cellWidth + radius;
        styles += `
        circle[x_coord="${x + 1}"] {
            cx: ${cx}px;
        }
        .finger[x_coord="${x + 1}"] {
            x: ${cx}px;
        }
        `;
    }

    for (let y = 0; y < gridHeight; y++) {
        const cy = y * cellHeight + cellHeight / 2;
        styles += `
            circle[y_coord="${y + 1}"] {
                cy: ${cy}px;
            }
            .finger[y_coord="${y + 1}"] {
                y: ${cy}px;
            }
        `;
    }

    // Update the content of the style element
    styleElement.innerHTML = styles;

    // Directly update finger text elements
    const fingerTexts = document.querySelectorAll('.finger');
    fingerTexts.forEach((text) => {
        const x_coord = parseInt(text.getAttribute('x_coord')) || 0;
        const y_coord = parseInt(text.getAttribute('y_coord')) || 0;
        const x = (gridWidth - x_coord) * cellWidth + radius;
        const y = (y_coord - 1) * cellHeight + cellHeight / 2;
        text.setAttribute('x', x);
        text.setAttribute('y', y);
    });
}

function drawChordGrid(chord, svgElement, style, preview = false) {
    svgElement.innerHTML = '';
    for (let i = 0; i < gridWidth; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('index', i)
        line.classList.add('lineY', 'full');
        svgElement.appendChild(line);
    }

    for (let i = 0; i < gridHeight; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('index', i)
        line.classList.add('lineX', 'full');
        svgElement.appendChild(line);
    }
    if (style == "samba") {
        chord.essential.forEach(string => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.classList.add('small');
            circle.setAttribute('x_coord', string);
            if (chord.essential.at(-1) != string) {
                circle.classList.add('full');
            } else {
                circle.classList.add('empty');
            }
            
            svgElement.appendChild(circle);
        });        
    }
    if (preview) {
        for (let x = 1; x <= gridWidth; x++) {
            for (let y = 1; y < gridHeight; y++) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.classList.add('preview');
                circle.setAttribute('x_coord', x);
                circle.setAttribute('y_coord', y);
                circle.classList.add('full');
                circle.classList.add('big');
                svgElement.appendChild(circle);
            }
        }
    }
        (chord.shape.match(/\(?\d+(-\d+)?,\s?\d+(,\s?\d+)?\)?/g) || []).forEach(coord => {
            if (coord.includes('-')) {
                const [xRange, y] = coord.replace(/[()]/g, '').split(',').map(part => part.trim());
                const [x1, x2] = xRange.split('-').map(Number);
               
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x_coord1', x1);
                line.setAttribute('x_coord2', x2);
                line.setAttribute('y_coord', y);
                line.classList.add('line-round', 'full', 'hover');
                svgElement.appendChild(line);
            } else {
                const [x, y, z] = coord.replace(/[()]/g, '').split(',').map(Number);
                if (x >= 1 && x <= gridWidth && y >= 1 && y <= gridHeight) {

                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.classList.add('full');
                    circle.classList.add('big');
                    circle.setAttribute('x_coord', x);
                    circle.setAttribute('y_coord', y);
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

                    text.classList.add('finger');
                    text.textContent = z;
                    text.setAttribute('x_coord', x);
                    text.setAttribute('y_coord', y);

                    svgElement.appendChild(circle);
                    svgElement.appendChild(text);
                }
            }
        });
    }

function convertToStickCounting(duration) {
    return 'I'.repeat(duration);
}

function generateChords(chordInput, resultContainer, style = "default") {
    // resultContainer is now a parameter instead of being retrieved from the DOM
    resultContainer.innerHTML = '';
    console.log("Result container: " + resultContainer.id);
    const chordEntries = chordInput.split(' ').filter(entry => entry !== '');
    console.log(chordEntries);
    let isGroup = false;
    let groupDiv = null;

    for (let i = 0; i < chordEntries.length; i += 2) {
        let chord = chordEntries[i];
        let duration = parseInt(chordEntries[i + 1]);

        if (chord.startsWith('{')) {
            isGroup = true;
            chord = chord.replace('{', '');

            groupDiv = document.createElement('div');
            groupDiv.classList.add('chord-group');
            resultContainer.appendChild(groupDiv);
        }
        if (!chord || isNaN(duration)) {
            continue;
        }

        const chordDiv = document.createElement('div');
        chordDiv.classList.add('chord-item');

        const durationText = document.createElement('div');
        durationText.textContent = convertToStickCounting(duration);
        durationText.classList.add('chord-duration');
        chordDiv.appendChild(durationText);

        const chordNameText = document.createElement('div');
        chordNameText.textContent = chord;
        chordNameText.classList.add('chord-name');
        chordDiv.appendChild(chordNameText);

        const chordSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chordSvg.classList.add('SvgElement');
        chordDiv.appendChild(chordSvg);

        if (chordDict[chord]) {
            drawChordGrid(chordDict[chord], chordSvg, style);
        } else {
            const noImageText = document.createElement('div');
            noImageText.textContent = 'No image found';
            chordDiv.appendChild(noImageText);
        }

        if (isGroup && groupDiv) {
            groupDiv.appendChild(chordDiv);
        } else {
            resultContainer.appendChild(chordDiv);
        }

        if (chordEntries[i + 1].includes('}')) {
            isGroup = false; 
            groupDiv = null;
        }
    }
}

function generateDocument() {
    const parts = document.getElementById('chordInput').value.split("\n%%%\n");
    parts[0].split(';\n').forEach(element => {
        const e = element.split(': ');
        document.getElementById(e[0]).innerHTML = e[1];        
    });
    const style = document.getElementById('style').innerHTML;
    generateChords(parts[1], style);
    update_css();
}
