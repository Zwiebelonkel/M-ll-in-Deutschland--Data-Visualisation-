let card = false; // Initialisierung der `card`-Variablen
let rows = []; // Globale Variable, um die Daten zu speichern
let chart = null; // Variable, um das Chart-Objekt zu speichern

document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    setupTooltip();
});

function moveOut() {
    let cardElement = document.getElementById("card");
    cardElement.style.transform = "translateX(-100%)";
    card = true;
}

function moveIn(BL) {
    let cardElement = document.getElementById("card");
    cardElement.style.transform = "translateX(0)";
    document.getElementById("cardname").innerHTML = BL;
    card = false;
}

function toggleCard(BL) {
    if (card == false) {
        moveOut();
        if (document.getElementById("cardname").innerHTML != BL) {
            moveOut();
        }
    } else {
        moveIn(BL);
    }
    // Erstelle das Pie-Chart für das ausgewählte Bundesland
    pieChart(rows, BL);
}

function Bw() { toggleCard("Baden-Württemberg"); }
function Hb() { toggleCard("Bremen"); }
function By() { toggleCard("Bayern"); }
function Be() { toggleCard("Berlin"); }
function Bb() { toggleCard("Brandenburg"); }
function Hh() { toggleCard("Hamburg"); }
function He() { toggleCard("Hessen"); }
function Mv() { toggleCard("Mecklenburg-Vorpommern"); }
function Ni() { toggleCard("Niedersachsen"); }
function Nw() { toggleCard("Nordrhein-Westfalen"); }
function Rp() { toggleCard("Rheinland-Pfalz"); }
function Sl() { toggleCard("Saarland"); }
function Sn() { toggleCard("Sachsen"); }
function St() { toggleCard("Sachsen-Anhalt"); }
function Sh() { toggleCard("Schleswig-Holstein"); }
function Th() { toggleCard("Thüringen"); }

async function fetchData() {
    const response = await fetch("Entsorgung von Abfällen - Bundesländer.csv");
    const data = await response.text();

    // Split the data by new lines, remove the header and the last empty line
    rows = data.split("\n").slice(4, -1).map(elt => {
        const row = elt.split(",").map(col => col.replace(/"/g, '').trim());

        // Combine thousand-separated numbers
        const combineNumber = (arr, idx) => parseFloat(arr[idx] + '.' + arr[idx + 1]);

        return {
            name: row[0],
            Abfallentsorgungsanlagen: parseInt(row[1]),
            InputVonEntsorgung: combineNumber(row, 2),
            ImEigenenBetrieb: combineNumber(row, 4),
            Inland: combineNumber(row, 6),
            Ausland: combineNumber(row, 8)
        };
    });
    console.log(rows);

    createHeatmap(rows);
}

function setupTooltip() {
    const tooltip = document.getElementById('tooltip');
    document.querySelectorAll('.map path').forEach(element => {
        element.addEventListener('mousemove', (event) => {
            tooltip.style.display = 'block';
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
            tooltip.innerHTML = element.getAttribute('data-name') + '<br>' + 'Value: ' + element.getAttribute('data-value');
        });
        element.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });
    });
}

function createHeatmap(data) {
    const maxValue = Math.max(...data.map(d => d.InputVonEntsorgung));
    const minValue = Math.min(...data.map(d => d.InputVonEntsorgung));
    function interpolateColor(value) {
        const startColor = [200, 222, 139];
        const endColor = [61, 139, 39];
        const differenz = maxValue - minValue
        const factor = value / differenz;
        const interpolate = (start, end, factor) => Math.round(start + (end - start) * factor);
        const r = interpolate(startColor[0], endColor[0], factor);
        const g = interpolate(startColor[1], endColor[1], factor);
        const b = interpolate(startColor[2], endColor[2], factor);
        return `rgb(${r},${g},${b})`;
    }

    data.forEach(d => {
        const idMap = {
            "Baden-Württemberg": "DE-BW",
            "Bayern": "DE-BY",
            "Berlin": "DE-BE",
            "Brandenburg": "DE-BB",
            "Bremen": "DE-HB",
            "Hamburg": "DE-HH",
            "Hessen": "DE-HE",
            "Mecklenburg-Vorpommern": "DE-MV",
            "Niedersachsen": "DE-NI",
            "Nordrhein-Westfalen": "DE-NW",
            "Rheinland-Pfalz": "DE-RP",
            "Saarland": "DE-SL",
            "Sachsen": "DE-SN",
            "Sachsen-Anhalt": "DE-ST",
            "Schleswig-Holstein": "DE-SH",
            "Thüringen": "DE-TH"
        };

        const elementId = idMap[d.name];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                const color = interpolateColor(d.InputVonEntsorgung);
                element.style.fill = color;
                element.setAttribute('data-name', d.name);
                element.setAttribute('data-value', d.InputVonEntsorgung);
            } else {
                console.error(`Element mit ID ${elementId} nicht gefunden.`);
            }
        } else {
            console.error(`Keine passende ID für das Bundesland ${d.name} gefunden.`);
        }
    });
}

// Funktion zum Erstellen des Pie-Charts für ein bestimmtes Bundesland
function pieChart(data, Bundesland) {
    // Finde die Daten für das ausgewählte Bundesland
    const selectedData = data.find(d => d.name === Bundesland);

    // Überprüfen, ob Daten für das ausgewählte Bundesland gefunden wurden
    if (selectedData) {
        console.log(selectedData); // Überprüfen der Daten im Konsolen-Log

        // Holen Sie sich das Canvas-Element und den Kontext
        var chrt = document.getElementById("chartId").getContext("2d");

        // Wenn bereits ein Chart existiert, zerstöre es
        if (chart) {
            chart.destroy();
        }

        // Erstellen Sie den Pie-Chart
        chart = new Chart(chrt, {
            type: 'pie',
            data: {
                labels: ["Ausland", "Inland", "Im eigenen Betrieb"],
                datasets: [{
                    label: Bundesland,
                    data: [
                        selectedData.Ausland,
                        selectedData.Inland,
                        selectedData.ImEigenenBetrieb,
                    ],
                    backgroundColor: ['aqua', 'yellow', 'pink', 'lightgreen'],
                    hoverOffset: 5
                }],
            },
            options: {
                responsive: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                let value = tooltipItem.raw;
                                if (value === 0) {
                                    return 'Keine Daten';
                                }
                                return tooltipItem.label + ': ' + value;
                            }
                        }
                    }
                }
            },
        });
    } else {
        console.error(`Daten für das Bundesland ${Bundesland} nicht gefunden.`);
    }
}

// Event-Listener für Klickereignisse auf jedes Bundesland
document.querySelectorAll('.map path').forEach(element => {
    element.addEventListener('click', () => {
        const Bundesland = element.getAttribute('data-name');
        toggleCard(Bundesland); // Aufruf der toggleCard-Funktion mit dem ausgewählten Bundesland
    });
});
