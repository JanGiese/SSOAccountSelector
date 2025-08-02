// Constants
const STORAGE_KEY = 'tenants';

// UI Elements
const createAccountEmailTextInput = (value = '') => {
    const input = document.createElement('input');
    input.type = "text";
    input.style.width = "300px";
    input.placeholder = "Enter email address";
    input.value = value;
    return input;
};

// Tenant Management
const saveTenants = (tenants) => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({[STORAGE_KEY]: tenants}, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
};

// Row Creation
const createAddTenantRow = (data) => {
    const row = document.createElement('tr');

    const tenantIdCell = document.createElement('td');
    const tenantIdInputInput = document.createElement('input');
    tenantIdInputInput.style.width = "250px";
    tenantIdInputInput.type = "text";
    tenantIdInputInput.placeholder = "Enter Tenant ID";
    tenantIdCell.appendChild(tenantIdInputInput);

    const accountEmailCell = document.createElement('td');
    accountEmailCell.appendChild(createAccountEmailTextInput());

    const buttonCell = document.createElement('td');
    const button = document.createElement('button');
    button.innerText = "\u2713";
    button.style.color = "green";

    button.addEventListener('click', async () => {
        const newTenant = tenantIdInputInput.value;
        if (newTenant) {
            try {
                data.tenants[newTenant] = {
                    text: accountEmailCell.children[0].value
                };
                await saveTenants(data.tenants);
                location.reload();
            } catch (error) {
                console.error('Failed to save tenant:', error);
            }
        }
    });

    buttonCell.appendChild(button);

    [tenantIdCell, accountEmailCell, buttonCell].forEach(cell => row.appendChild(cell));
    return row;
};

const createEditTenantRow = (tenant, data) => {
    const row = document.createElement('tr');

    const tenantIdCell = document.createElement('td');
    tenantIdCell.innerText = tenant;

    const accountEmailCell = document.createElement('td');
    const accountEmailInput = createAccountEmailTextInput(data.tenants[tenant].text);
    accountEmailInput.addEventListener("blur", async () => {
        try {
            data.tenants[tenant].text = accountEmailInput.value;
            await saveTenants(data.tenants);
        } catch (error) {
            console.error('Failed to update banner text:', error);
        }
    });
    accountEmailCell.appendChild(accountEmailInput);

    const buttonCell = document.createElement('td');
    const button = document.createElement('button');
    button.innerText = "X";
    button.style.color = "red";
    button.addEventListener('click', async () => {
        try {
            delete data.tenants[tenant];
            await saveTenants(data.tenants);
            location.reload();
        } catch (error) {
            console.error('Failed to delete tenant:', error);
        }
    });
    buttonCell.appendChild(button);

    [tenantIdCell, accountEmailCell, buttonCell].forEach(cell => row.appendChild(cell));
    return row;
};

// Initialize
const initializeTenantsTable = (data) => {
    const tenantTable = document.getElementById("tenant-table");

    Object.keys(data.tenants).forEach(tenant => {
        tenantTable.appendChild(createEditTenantRow(tenant, data));
    });

    tenantTable.appendChild(createAddTenantRow(data));
};

// Load initial data
chrome.storage.sync.get(STORAGE_KEY, (data) => {
    if (!data.tenants) {
        data.tenants = {};
    }
    initializeTenantsTable(data);
});