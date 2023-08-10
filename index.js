import { html } from "https://unpkg.com/lit@latest?module";
import { pureLit, useState, useOnce } from "https://unpkg.com/pure-lit@latest?module";

const selfOrigin = window.location.url

const FILE_LOADED = "spdx:file:loaded"
const SEARCH_CHANGED = "spdx:search:changed"
const FILTER_CHANGED = "spdx:filter:changed"

function sendMessage(type, message) {
    window.postMessage({ type, message }, selfOrigin)
}

function registerReceiveMessage(type, onReceive) {
    window.addEventListener('message', function (event) {
        if (event.data.type !== type) {
            return
        }

        onReceive(event.data.message)
    })
}

const formatFieldType = (pkg, field) => {
    if (!pkg || !pkg[field]) return []
    if (field === "licenseDeclared") {
        return pkg[field].replace(/LicenseRef-/gi, '').split(" AND ")
    } else {
        return pkg[field].split(",")
    }
}

pureLit("spdx-file-input", () => {
    const loadFile = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        
        const reader = new FileReader();
        reader.onload = (event) => {
            sendMessage(FILE_LOADED, JSON.parse(event.target.result));
        };

        reader.readAsText(file);
    }

    return html`<input type="file" title="Input source for a valid spdx json file" placeholder="Drop or select an spdx json file" @change=${loadFile} />`
})

pureLit("spdx-filter", (element) => {
    const {get: entries, set} = useState(element, [])
    const {field} = element;


    useOnce(element, () => {
        registerReceiveMessage(FILE_LOADED, (file) => {
            set([...new Set(
                file.packages.reduce((result, pkg) => [
                    ...result, 
                    ...(formatFieldType(pkg, field))
                ], []
            ))].sort())
        })
    })

    return html`
    ${entries().length > 0 ? html`<slot></slot>` : ""}
    <form>${entries().map(entry => 
        html`
            <input 
                type="checkbox" 
                id="${entry}" 
                name="filters" 
                value=${entry} 
                @click=${(event) => 
                    sendMessage(
                        FILTER_CHANGED, 
                        {
                            field,
                            data: [...new FormData(event.target.form).values()]
                        })
                } /> 
            <label for=${entry}>${entry}</label>`)}</form>`
}, {
    defaults: {
        field: "licenseDeclared"
    }
})

pureLit("spdx-search", (element) => {
    const {field, placeholder} = element
    const {get: entries, set} = useState(element, [])
    
    useOnce(element, () => {
        registerReceiveMessage(FILE_LOADED, (file) => {
            set([...new Set(
                file.packages.reduce((result, pkg) => [
                    ...result, 
                    ...(formatFieldType(pkg, field))
                ], []
            ))].sort())
        })
    })

    return entries().length < 1 ? html`` : html`
        <label for="search"><slot></slot></label>
        <input 
            id="search" 
            type="text" 
            placeholder=${placeholder} 
            @input=${(event) => sendMessage(SEARCH_CHANGED, {field, data: event.target.value})} 
        />`;
}, {
    defaults : { placeholder: "Search", field: "name" }
})

pureLit("spdx-table", (element) => {
    const {get: entries, set} = useState(element, [])
    const {get: search, set: setSearch} = useState(element, "")
    const {get: filterLicenses, set: setFilterLicenses} = useState(element, "")
    const columns = element.columns.split(",").map(col => col.trim())

    useOnce(element, () => {
        registerReceiveMessage(FILE_LOADED, (file) =>
            set(file.packages)
        )
        registerReceiveMessage(SEARCH_CHANGED, setSearch)
        registerReceiveMessage(FILTER_CHANGED, setFilterLicenses)
    })

    const filteredEntries = () => {
        const isFound = (pkg) => {
            const {field, data} = search()
            console.log("[isFound]: Field", field, "Data", data)
            return !pkg[field] || pkg[field].includes(data) 
        }

        const isFiltered = (pkg) => {
            const {field, data} = filterLicenses()
            console.log("[isFiltered]: Field", field, "Data", data)
            return data.length < 1 || (!pkg[field] || data.some(licence => pkg.licenseDeclared.includes(licence.trim())))
        }

        if (search().length < 1 && filterLicenses().length < 1) return entries();
        return entries()
            .filter(pkg => 
                isFound(pkg) && isFiltered(pkg)
            )
    }

    return filteredEntries().length < 1 ? html`no data...` : html`<table>
        <tr>
            ${columns.map(column => html`<th>${column}</th>`)}
        </tr>
        ${filteredEntries().map(item => html`<tr>
            ${columns.map(column => html`<td>${item[column]}</td>`)}
        </tr>`)}
    </table>`
}, {
    defaults: {
        columns: "name,licenseDeclared"
    }
})