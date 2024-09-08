const chordDict = {
    'C': '(2, 1, 1), (4, 2, 2), (5, 3, 3)',
    'G': '(5, 2, 1), (6, 3, 2), (2, 3, 3), (1, 3, 4)',
    'D': '(1, 2, 2), (2, 3, 3), (3, 2, 1)',
    'F': '(1-6, 1), (3, 2, 2), (4, 3, 4), (5, 3, 3)' // Here, '1-6, 1' represents a line
};

function drawChordGrid(coordinates, svgElement, gridWidth = 5, gridHeight = 5, cellWidth = 30, cellHeight = 40, radius = 10) {
    svgElement.innerHTML = ''; // Clear previous SVG content
    svgElement.style.width = `${gridWidth * cellWidth + 2 * radius}px`;
    svgElement.style.height = `${gridHeight * cellHeight + 2 * radius}px`;

    // Draw grid lines
    for (let i = 0; i <= gridWidth; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', i * cellWidth + radius);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', i * cellWidth + radius);
        line.setAttribute('y2', gridHeight * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', '2');
        svgElement.appendChild(line);
    }

    for (let i = 0; i <= gridHeight; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', radius);
        line.setAttribute('y1', i * cellHeight);
        line.setAttribute('x2', gridWidth * cellWidth + radius);
        line.setAttribute('y2', i * cellHeight);
        line.setAttribute('stroke', '#000');
        line.setAttribute('stroke-width', i === 0 ? '10' : '2');
        svgElement.appendChild(line);
    }

    // Parse and place circles or lines at coordinates
    coordinates.forEach(coord => {
        // Check if it's a line or a regular circle
        if (coord.includes('-')) {
            // Handle lines: e.g., '(1-6, 1)'
            const [xRange, y] = coord.replace(/[()]/g, '').split(',').map(part => part.trim());
            const [x1, x2] = xRange.split('-').map(Number);
            const yCoord = parseInt(y);

            // Calculate line positions
            const x1Pos = (gridWidth - x1 + 1) * cellWidth + radius;
            const x2Pos = (gridWidth - x2 + 1) * cellWidth + radius;
            const yPos = (yCoord - 1) * cellHeight + cellHeight / 2;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1Pos);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', x2Pos);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', radius);  // Line width matches 2 * radius of circles
            line.setAttribute('stroke-linecap', 'round'); // Rounded corners
            svgElement.appendChild(line);
        } else {
            // Handle regular circles: e.g., '(3, 2, 1)'
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

// Helper function to convert number duration to stick counting
function convertToStickCounting(duration) {
    return 'I'.repeat(duration);
}

// Function to generate the chords display and SVG for each chord
function generateChords(chordInput) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';  // Clear existing content

    const chordEntries = chordInput.split(' ').filter(entry => entry !== '');

    let isGroup = false;
    let groupDiv = null;

    for (let i = 0; i < chordEntries.length; i += 2) {
        let chord = chordEntries[i];
        let duration = parseInt(chordEntries[i + 1]);

        // If opening curly brace, start a new chord group
        if (chord.startsWith('{')) {
            isGroup = true;
            chord = chord.replace('{', ''); // Remove opening curly brace

            // Create a new group div
            groupDiv = document.createElement('div');
            groupDiv.classList.add('chord-group');
            resultContainer.appendChild(groupDiv);
        }

        // Skip invalid chords/durations
        if (!chord || isNaN(duration)) {
            continue;
        }

        // Create a container div for each chord
        const chordDiv = document.createElement('div');
        chordDiv.classList.add('chord-item');

        // Display duration in stick counting format
        const durationText = document.createElement('div');
        durationText.textContent = convertToStickCounting(duration);
        durationText.classList.add('chord-duration');
        chordDiv.appendChild(durationText);

        // Display chord name
        const chordNameText = document.createElement('div');
        chordNameText.textContent = chord;
        chordNameText.classList.add('chord-name');
        chordDiv.appendChild(chordNameText);

        // Create an SVG element to display the chord diagram
        const chordSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chordDiv.appendChild(chordSvg);

        // Get the coordinates from the dictionary and generate SVG
        if (chordDict[chord]) {
            const coordinates = chordDict[chord].match(/\(?\d+(-\d+)?,\s?\d+(,\s?\d+)?\)?/g); // Adjusted regex to match lines and circles
            drawChordGrid(coordinates, chordSvg); // Reuse function to draw SVG for this chord
        } else {
            const noImageText = document.createElement('div');
            noImageText.textContent = 'No image found';
            chordDiv.appendChild(noImageText);
        }

        // Append the chord div to the result container or group
        if (isGroup && groupDiv) {
            groupDiv.appendChild(chordDiv);
        } else {
            resultContainer.appendChild(chordDiv);
        }

        // If closing curly brace, finalize the group and attach ID
        if (chordEntries[i + 1].includes('}')) {
            // Extract the group ID and remove the closing curly brace
            const elements = chordEntries[i + 1].split('}')[1].split('-')
            const groupId = elements[1];
            const text = elements[2];
            if (groupDiv && groupId) {
                groupDiv.id = groupId;
            }
            if (groupDiv && text) {
                groupDiv.innerHTML += text;
            }
            // Set duration correctly and end the group
            duration = parseInt(chordEntries[i + 1].replace('}', '').split('-')[0]);
            isGroup = false;  // Close the group
            groupDiv = null;  // Reset the groupDiv for the next iteration
        }
    }
}

function generateDocument(){
    const parts = document.getElementById('chordInput').value.split("\n%%%\n");
    parts[0].split(';\n').forEach(element => {
        const e = element.split(': ');
        document.getElementById(e[0]).innerHTML = e[1];        
    });
    generateChords(parts[1]);
}
