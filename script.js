/*
update svg
svgElement.style.width = `${gridWidth * cellWidth + 2 * radius + stroke}px`;
svgElement.style.height = `${gridHeight * cellHeight + 2 * radius + stroke + smallRadius}px`;

update line y
line.setAttribute('x1', i * cellWidth + radius);
line.setAttribute('y1', 0);
line.setAttribute('x2', i * cellWidth + radius);
line.setAttribute('y2', gridHeight * cellHeight);
line.setAttribute('stroke', '#000');
line.setAttribute('stroke-width', (stroke).toString());

update line x
line.setAttribute('x1', radius);
line.setAttribute('y1', i * cellHeight);
line.setAttribute('x2', gridWidth * cellWidth + radius);
line.setAttribute('y2', i * cellHeight);
line.setAttribute('stroke', '#000');
line.setAttribute('stroke-width', i === 0 ? (5*stroke).toString() : (stroke).toString());

update small circle 
circle.setAttribute('cx', (gridWidth - string + 1) * cellWidth + radius);
circle.setAttribute('cy', cellHeight*gridHeight + radius + 2*stroke);
circle.setAttribute('r', smallRadius);

update big circle and text
const cx = (gridWidth - x + 1) * cellWidth + radius;
const cy = (y - 1) * cellHeight + cellHeight / 2;

circle.setAttribute('cx', cx);
circle.setAttribute('cy', cy);
circle.setAttribute('r', radius);

text.setAttribute('x', cx);
text.setAttribute('y', cy);
*/ 
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

document.getElementById('uploadButton').addEventListener('click', () => {
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
            chords = jsonContent.map(chordData => new Chord(
                chordData.name, 
                chordData.shape,
                chordData.essential,
                chordData.exclude
            ));
            chordDict = chords.reduce((dict, chord) => {
                dict[chord.name] = new Chord(chord.name, chord.shape, chord.essential, chord.exclude);
                return dict;
            }, {});
        } catch (e) {
            alert("Error parsing JSON file.");
            console.error(e);
        }
    };
    reader.readAsText(file);
});
function update_css(svgElement, gridWidth = 5, gridHeight = 5) {
    const cellWidth = parseInt(document.getElementById('cellWidthSlider').value);
    const cellHeight = parseInt(document.getElementById('cellHeightSlider').value);
    const radius = parseInt(document.getElementById('radiusSlider').value);
    const stroke = parseInt(document.getElementById('strokeSlider').value);
    const smallRadius = parseInt(document.getElementById('smallRadiusSlider').value);
    // Update the svgElement size
    svgElement.style.width = `${gridWidth * cellWidth + 2 * radius + stroke}px`;
    svgElement.style.height = `${gridHeight * cellHeight + 2 * radius + stroke + smallRadius}px`;

    // Update Y-axis grid lines (vertical)
    const yLines = svgElement.querySelectorAll('.lineY');
    yLines.forEach((line, i) => {
        line.setAttribute('x1', i * cellWidth + radius);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', i * cellWidth + radius);
        line.setAttribute('y2', gridHeight * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', stroke.toString());
    });

    // Update X-axis grid lines (horizontal)
    const xLines = svgElement.querySelectorAll('.lineX');
    xLines.forEach((line, i) => {
        line.setAttribute('x1', radius);
        line.setAttribute('y1', i * cellHeight);
        line.setAttribute('x2', gridWidth * cellWidth + radius);
        line.setAttribute('y2', i * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', i === 0 ? (5 * stroke).toString() : stroke.toString());
    });

    // Update small circles (essential chord positions)
    const smallCircles = svgElement.querySelectorAll('.small');
    smallCircles.forEach((circle) => {
        const string = parseInt(circle.getAttribute('x_coord')); // Extract string number from x_coord
        circle.setAttribute('cx', (gridWidth - string + 1) * cellWidth + radius);
        console.log((cellHeight * gridHeight + radius + 2 * stroke).toString());
        circle.setAttribute('cy', (cellHeight * gridHeight + radius + 2 * stroke).toString());
        circle.setAttribute('r', smallRadius);
        circle.setAttribute('stroke-width', stroke);
    });

    // Update big circles and corresponding text (fretboard positions)
    const bigCircles = svgElement.querySelectorAll('.big');
    bigCircles.forEach((circle) => {
        const x = parseInt(circle.getAttribute('x_coord')); // X coordinate (string number)
        const y = parseInt(circle.getAttribute('y_coord')); // Y coordinate (fret number)
        const cx = (gridWidth - x + 1) * cellWidth + radius;
        const cy = (y - 1) * cellHeight + cellHeight / 2;
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', radius);
    });

    // Update the text elements (finger positions)
    const texts = svgElement.querySelectorAll('.finger');
    texts.forEach((text) => {
        const x = parseInt(text.getAttribute('x_coord')); // X coordinate (string number)
        const y = parseInt(text.getAttribute('y_coord')); // Y coordinate (fret number)
        const cx = (gridWidth - x + 1) * cellWidth + radius;
        const cy = (y - 1) * cellHeight + cellHeight / 2;
        text.setAttribute('x', cx);
        text.setAttribute('y', cy);
    });
}
function drawChordGrid(chord, svgElement, style, gridWidth = 5, gridHeight = 5) {
    svgElement.innerHTML = '';

    for (let i = 0; i <= gridWidth; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('index', i)
        line.classList.add('lineY');
        svgElement.appendChild(line);
    }

    for (let i = 0; i <= gridHeight; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('index', i)
        line.classList.add('lineX');
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

    chord.shape.match(/\(?\d+(-\d+)?,\s?\d+(,\s?\d+)?\)?/g).forEach(coord => {
        if (coord.includes('-')) {
            /*
            Leave this comment here
            const [xRange, y] = coord.replace(/[()]/g, '').split(',').map(part => part.trim());
            const [x1, x2] = xRange.split('-').map(Number);
            const yCoord = parseInt(y);

            const x1Pos = (gridWidth - x1 + 1) * cellWidth + radius;
            const x2Pos = (gridWidth - x2 + 1) * cellWidth + radius;
            const yPos = (yCoord - 1) * cellHeight + cellHeight / 2;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1Pos);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', x2Pos);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', radius); 
            line.setAttribute('stroke-linecap', 'round');
            svgElement.appendChild(line);
            */
        } else {
            const [x, y, z] = coord.replace(/[()]/g, '').split(',').map(Number);
            if (x >= 1 && x <= 6 && y >= 1 && y <= 6) {

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
    update_css(svgElement);
}

function convertToStickCounting(duration) {
    return 'I'.repeat(duration);
}

function generateChords(chordInput, style = "default") {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';

    const chordEntries = chordInput.split(' ').filter(entry => entry !== '');

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
        chordSvg.id = 'SvgElement';
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
}
