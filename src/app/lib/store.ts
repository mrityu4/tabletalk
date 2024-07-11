
type Listener = (...args: any[]) => void;

interface Table {
  name: string;
  passKey: string;
  dishes: string[];
  listeners: { [event: string]: Listener[] };
}

let tables: { [key: string]: Table } = {};

function createTableStore(name: string) {
  if (Object.values(tables).some(table => table.name === name)) {
    return { success: false, error: 'Table name already exists' };
  }
  const tableId = Math.random().toString(36).substr(2, 9);
  const passKey = Math.floor(1000 + Math.random() * 9000).toString();
  tables[tableId] = { name, passKey, dishes: [], listeners: {} };
  console.log('Created table:', tables);
  return { success: true, tableId, passKey };
}

const searchTablesStore = (query: string): string[] => {
  return Object.values(tables)
    .filter(table => table.name.toLowerCase().includes(query.toLowerCase()))
    .map(table => table.name);
}

const joinTableStore = (name: string, passKey: string) => {
  const tableEntry = Object.entries(tables).find(([_, t]) => t.name === name);
  if (!tableEntry) {
    return { success: false, error: 'Table not found' };
  }

  const [tableId, table] = tableEntry;

  if (table.passKey !== passKey) {
    return { success: false, error: 'Incorrect pass key' };
  }
  return { success: true, tableId, tableName: table.name };
}

function addDishStore(tableId: string, dish: string) {
  emit('dishAdded', tableId, ["hello", "world"]);
  if (tables[tableId]) {
    tables[tableId].dishes.push(dish);
    emit('dishAdded', tableId, tables[tableId].dishes);
    return { success: true };
  }
  return { success: false, error: 'Table not found' };
}

const getDishesStore = (tableId: string) => {
  if (tables[tableId]) {
    return { success: true, dishes: tables[tableId].dishes };
  }
  return { success: false, error: 'Table not found' };
}
async function on(event: string, listener: Listener, tableId: string) {
  console.log('on', tables);
  if (!tables[tableId]) {
    // console.error(`Table with ID ${tableId} does not exist.`);
    // return;
    tables[tableId] = { name: 'fallback', passKey: '1234', dishes: [], listeners: { "dishAdded": [listener] } };
  }

  if (!tables[tableId].listeners) {
    tables[tableId].listeners = {};
  }
  if (!tables[tableId].listeners[event]) {
    tables[tableId].listeners[event] = [];
  }
  tables[tableId].listeners[event].push(listener);
  console.log('Updated listeners for table:', tableId, tables[tableId].listeners);
}

function off(event: string, listener: Listener, tableId: string) {
  if (!tables[tableId]) {
    console.error(`Table with ID ${tableId} does not exist.`);
    return;
  }

  if (!tables[tableId].listeners[event]) return;
  tables[tableId].listeners[event] = tables[tableId].listeners[event].filter(l => l !== listener);
};
async function emit(event: string, tableId: string, ...args: any[]) {
  console.log('tables', tables);
  if (!tables[tableId]) {
    console.error(`Table with ID ${tableId} does not exist.`);
    return;
  }
  console.log('EventEmitter:', tables[tableId].listeners[event]);
  if (!tables[tableId].listeners[event]) return;
  const listeners = tables[tableId].listeners[event];
  listeners.forEach(listener => listener(...args));
}

export {
  addDishStore, createTableStore, emit,
  getDishesStore, joinTableStore, off, on, searchTablesStore, tables
};

