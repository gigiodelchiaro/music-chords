class Chord {
    constructor(name, shape, essential, exclude = []) {
        this.name = name;  // Add name to the Chord class
        this.shape = shape;
        this.essential = essential;
        this.exclude = exclude;
    }
}

// This will hold the dynamically loaded chords
let chords = [];

// This will hold the dictionary of chords
let chordDict = {};

// Function to handle file upload
document.getElementById('uploadButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file first.");
        return;
    }

    // Read the file as text
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            // Parse the JSON content
            const jsonContent = JSON.parse(event.target.result);

            // Populate chords array
            chords = jsonContent.map(chordData => new Chord(
                chordData.name,   // Include the name from the parsed data
                chordData.shape,
                chordData.essential,
                chordData.exclude
            ));

            // Now build the chordDict after the chords array is populated
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
// Rest of the code
function drawChordGrid(chord, svgElement, style, gridWidth = 5, gridHeight = 5, cellWidth = 30, cellHeight = 40, radius = 10, stroke = 2, smallRadius = 5) {
    svgElement.innerHTML = '';
    svgElement.style.width = `${gridWidth * cellWidth + 2 * radius + stroke}px`;
    svgElement.style.height = `${gridHeight * cellHeight + 2 * radius + stroke + smallRadius}px`;

    // Draw the grid lines
    for (let i = 0; i <= gridWidth; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', i * cellWidth + radius);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', i * cellWidth + radius);
        line.setAttribute('y2', gridHeight * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', (stroke).toString());
        svgElement.appendChild(line);
    }

    for (let i = 0; i <= gridHeight; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', radius);
        line.setAttribute('y1', i * cellHeight);
        line.setAttribute('x2', gridWidth * cellWidth + radius);
        line.setAttribute('y2', i * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', i === 0 ? (5*stroke).toString() : (stroke).toString());
        svgElement.appendChild(line);
    }
    if (style == "samba") {
        chord.essential.forEach(string => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', (gridWidth - string + 1) * cellWidth + radius);
            circle.setAttribute('cy', cellHeight*gridHeight + radius + 2*stroke);
            circle.setAttribute('r', smallRadius);
            if (chord.essential.at(-1) == string) {
                circle.setAttribute('fill', 'none');
                circle.setAttribute('stroke', '#000');
                circle.setAttribute('stroke-width', (stroke).toString());
            } else {
                circle.setAttribute('fill', '#000');
            }
            
            svgElement.appendChild(circle);
        });        
    }
    // Draw the chord shape
    chord.shape.match(/\(?\d+(-\d+)?,\s?\d+(,\s?\d+)?\)?/g).forEach(coord => {
        if (coord.includes('-')) {
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
        } else {
            const [x, y, z] = coord.replace(/[()]/g, '').split(',').map(Number);
            if (x >= 1 && x <= 6 && y >= 1 && y <= 6) {
                const cx = (gridWidth - x + 1) * cellWidth + radius;
                const cy = (y - 1) * cellHeight + cellHeight / 2;

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
                circle.setAttribute('r', radius);
                circle.setAttribute('fill', '#000');

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx);
                text.setAttribute('y', cy);
                text.setAttribute('fill', '#FFF');
                text.setAttribute('text-anchor', 'middle');
                text.textContent = z;

                svgElement.appendChild(circle);
                svgElement.appendChild(text);
            }
        }
    });
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
