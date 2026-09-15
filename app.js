const CCL_PROGRAM =
    "mrd_aps_pplan_active_pts:group1";

let data = {
    patients: []
};

let activeSort = {
    field: "ptName",
    ascending: true
};

const tableBody =
    document.getElementById("patientTableBody");

const searchBox =
    document.getElementById("searchBox");

const refreshButton =
    document.getElementById("refreshButton");

const statusMessage =
    document.getElementById("statusMessage");

const patientCount =
    document.getElementById("patientCount");


function createCell(text) {
    const cell = document.createElement("td");

    cell.textContent = text || "";

    return cell;
}


function renderPatients(patients) {

    tableBody.innerHTML = "";

    patientCount.textContent = patients.length;

    if (patients.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-message";
        cell.textContent = "No APS Care patients found.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    patients.forEach(function(patient) {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const patientLink = document.createElement("a");

        patientLink.href = "#";
        patientLink.className = "patient-link";
        patientLink.textContent = patient.ptName || "";

        patientLink.addEventListener(
            "click",
            function(event) {
                event.preventDefault();
                event.stopPropagation();

                openPatientChart(patient);
            }
        );

        nameCell.appendChild(patientLink);

        const roomBed =
            [patient.room, patient.bed]
                .filter(Boolean)
                .join(" / ");

        row.appendChild(nameCell);
        row.appendChild(createCell(patient.mrn));
        row.appendChild(createCell(patient.orderedDttm));
        row.appendChild(createCell(patient.unit));
        row.appendChild(createCell(roomBed));

        row.addEventListener(
            "click",
            function() {
                openPatientChart(patient);
            }
        );

        tableBody.appendChild(row);
    });
}


function openPatientChart(patient) {

    openChart(
        patient.personId,
        patient.encntrId
    );
}


function openChart(personId, encntrId, tabName = "") {

    APPLINK(
        0,
        "Powerchart.exe",
        "/PERSONID=" + personId +
        " /ENCNTRID=" + encntrId +
        (
            tabName.trim() !== ""
                ? " /FIRSTTAB=^" + tabName + "^"
                : ""
        )
    );
}


function filterPatients() {

    const searchText =
        searchBox.value
            .trim()
            .toLowerCase();

    const filteredPatients =
        data.patients.filter(function(patient) {

            const patientName =
                (patient.ptName || "")
                    .toLowerCase();

            const mrn =
                (patient.mrn || "")
                    .toLowerCase();

            return (
                patientName.includes(searchText) ||
                mrn.includes(searchText)
            );
        });

    renderPatients(filteredPatients);
}


function sortPatients(field) {

    if (activeSort.field === field) {
        activeSort.ascending =
            !activeSort.ascending;
    }

    else {
        activeSort.field = field;
        activeSort.ascending = true;
    }

    data.patients.sort(function(a, b) {

        const valueA =
            (a[field] || "")
                .toString()
                .toLowerCase();

        const valueB =
            (b[field] || "")
                .toString()
                .toLowerCase();

        const comparison =
            valueA.localeCompare(valueB);

        return activeSort.ascending
            ? comparison
            : -comparison;
    });

    updateSortIndicators();
    filterPatients();
}


function updateSortIndicators() {

    const indicators = {
        ptName: document.getElementById("nameSortIndicator"),
        orderedDttm: document.getElementById("orderedSortIndicator"),
        unit: document.getElementById("unitSortIndicator")
    };

    Object.keys(indicators).forEach(function(field) {

        indicators[field].textContent =
            field === activeSort.field
                ? (activeSort.ascending ? "▲" : "▼")
                : "↕";
    });
}


function loadPatients() {

    statusMessage.textContent =
        "Loading APS Care patients...";

    const request = new XMLCclRequest();

    request.onreadystatechange =
        function() {

            if (request.readyState !== 4) {
                return;
            }

            if (request.status !== 200) {
                statusMessage.textContent =
                    "Unable to load APS Care patients.";

                return;
            }

            try {

                const response =
                    JSON.parse(request.responseText);

                data.patients =
                    response.reply.patients || [];

                sortPatients("ptName");

                statusMessage.textContent =
                    "Loaded " +
                    data.patients.length +
                    " APS Care patient(s).";

            }

            catch (error) {

                statusMessage.textContent =
                    "Unable to process patient data.";

                console.error(error);
            }
        };

    request.open(
        "GET",
        CCL_PROGRAM,
        true
    );

    request.send("^MINE^");
}


searchBox.addEventListener(
    "input",
    filterPatients
);

refreshButton.addEventListener(
    "click",
    loadPatients
);

document.getElementById("nameHeader")
    .addEventListener(
        "click",
        function() {
            sortPatients("ptName");
        }
    );

document.getElementById("orderedHeader")
    .addEventListener(
        "click",
        function() {
            sortPatients("orderedDttm");
        }
    );

document.getElementById("unitHeader")
    .addEventListener(
        "click",
        function() {
            sortPatients("unit");
        }
    );


const resizableHeaders =
    document.querySelectorAll("th.resizable");

resizableHeaders.forEach(
    function(header, columnIndex) {

        const handle =
            header.querySelector(".resize-handle");

        handle.addEventListener(
            "mousedown",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                const startX = event.pageX;
                const startWidth = header.offsetWidth;

                function resizeColumn(event) {

                    const newWidth =
                        startWidth +
                        (event.pageX - startX);

                    if (newWidth < 70) {
                        return;
                    }

                    header.style.width =
                        newWidth + "px";

                    header.style.minWidth =
                        newWidth + "px";

                    header.style.maxWidth =
                        newWidth + "px";

                    const rows =
                        document.querySelectorAll(
                            "#patientTableBody tr"
                        );

                    rows.forEach(function(row) {

                        const cell =
                            row.children[columnIndex];

                        if (cell) {
                            cell.style.width =
                                newWidth + "px";

                            cell.style.minWidth =
                                newWidth + "px";

                            cell.style.maxWidth =
                                newWidth + "px";
                        }
                    });
                }

                function stopResize() {

                    document.removeEventListener(
                        "mousemove",
                        resizeColumn
                    );

                    document.removeEventListener(
                        "mouseup",
                        stopResize
                    );
                }

                document.addEventListener(
                    "mousemove",
                    resizeColumn
                );

                document.addEventListener(
                    "mouseup",
                    stopResize
                );
            }
        );
    }
);

loadPatients();