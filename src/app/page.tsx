'use client';
import { useEffect, useState } from 'react';
import { addDish, createTable, getDishes, joinTable, searchTable } from './actions';

export default function Home() {
  const [username, setUsername] = useState('');
  const [tableName, setTableName] = useState('');
  const [passKey, setPassKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingTables, setMatchingTables] = useState<{ id: string; name: string }[]>([]);
  const [currentTable, setCurrentTable] = useState<string>();
  const [dishes, setDishes] = useState<string[]>([]);
  const [newDish, setNewDish] = useState('');

  useEffect(() => {
    const storedUsername = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('tableId');
    const urlPassKey = urlParams.get('passKey');
    if (tableId && urlPassKey) {
      handleJoinTable(tableId, urlPassKey);
    }

  }, []);

  useEffect(() => {
    if (currentTable) {
      fetchAllDishes();

      const eventSource = new EventSource(`/api/sse?table=${currentTable}`);
      eventSource.onmessage = (event) => {
        const dish = JSON.parse(event.data);
        console.log('Received dish', dish);
        setDishes((prevDishes) => [...prevDishes, dish]);
      };
      return () => eventSource.close();
    }
  }, [currentTable]);

  const handleUsernameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.target as HTMLFormElement);
    e.preventDefault();
    const submittedUsername = formData.get('username');
    if (submittedUsername && typeof submittedUsername === 'string') {
      document.cookie = `username=${submittedUsername}; max-age=${5 * 60 * 60}`;
      setUsername(submittedUsername);
    }
    document.cookie = `username=${username}; max-age=${5 * 60 * 60}`;
  };

  const fetchAllDishes = async () => {
    const allDishes = await getDishes(currentTable!);
    setDishes(allDishes);
  };

  const handleCreateTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await createTable(tableName);
    if (result.success && result.tableId) {
      setCurrentTable(result.tableId);
      setPassKey(result.passKey);
    } else {
      alert(result.message);
    }
  };

  const handleSearchTable = async () => {
    if (searchQuery.length > 2) {
      const data = await searchTable(searchQuery);
      setMatchingTables(data);
    }
  };

  const handleJoinTable = async (tableId: string, tablePassKey = passKey) => {
    const result = await joinTable(tableId, tablePassKey);
    if (result.success) {
      setCurrentTable(tableId);
      setPassKey(tablePassKey);
    } else {
      alert(result.message);
    }
  };

  const handleAddDish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newDish && currentTable) {
      await addDish(currentTable, newDish);
      setNewDish('');
    }
  };
  const getShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?tableId=${currentTable}&passKey=${passKey}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    alert('Share link copied to clipboard!');
  };

  if (!username) {
    return (
      <form onSubmit={handleUsernameSubmit} className='container flex justify-center mt-4  mx-auto gap-2'>
        <input
          type="text"
          name='username'
          className="input w-full max-w-xs"
          placeholder="Enter your name"
          required
        />
        <button className='btn' type="submit">Submit</button>

      </form>
    );
  }

  if (!currentTable) {
    return (
      <div className="container  mx-auto mt-3 p-3 sm:flex w-full sm:w-1/2 sm:flex-col border-opacity-50">
        <div className="card bg-base-300 rounded-box grid  place-items-center p-4">
          <h2 className='pb-4'>Create a new table</h2>
          <form onSubmit={handleCreateTable} className='flex gap-2 pb-4'>
            <input
              type="text"
              value={tableName}
              className="input w-full max-w-xs"
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              required
            />
            <button className='btn w-32' type="submit">Create Table</button>
          </form>
        </div>
        <div className="divider">OR</div>
        <div className="card bg-base-300 rounded-box grid  place-items-center p-4">
          <h2 className='pb-4'>Join an existing table</h2>
          <div className='flex gap-2 pb-4'>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a table"
              className="input w-full max-w-xs"
            />
            <button className='btn w-32' onClick={handleSearchTable}>Search</button>
          </div>
          {matchingTables.map((table) => (
            <div key={table.id} className='flex gap-2 pb-4 justify-between items-center w-full sm:w-1/2'>
              <span>{table.name}</span>
              <div>
                <input
                  type="text"
                  className="input w-40 max-w-xs"
                  placeholder="Enter passkey"
                  onChange={(e) => setPassKey(e.target.value)}
                />
                <button className='btn' onClick={() => handleJoinTable(table.id)}>Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto mt-3 p-3 sm:flex w-full sm:w-1/2 sm:flex-col border-opacity-50 h-dvh'>
      <div className='flex gap-2 pb-5 items-center'>
        <h2 className=' mx-auto pb-4 text-2xl w-full'>Table: {currentTable}</h2>
        <button className='btn mx-auto' onClick={copyShareLink}>Share Link</button>
      </div>
      <form onSubmit={handleAddDish} className='flex gap-2 pb-6 justify-center'>
        <input
          type="text"
          className='input w-full max-w-xs'
          value={newDish}
          onChange={(e) => setNewDish(e.target.value)}
          placeholder="Enter dish name"
          required
        />
        <button className='btn' type="submit">Add</button>
      </form>
      <ul className='flex flex-col gap-2 pb-4 items-center h-full overflow-y-scroll'>
        {dishes.map((dish, index) => (
          <li className='w-full justify-between sm:w-72 bg-base-300 rounded-box flex p-4 items-center gap-2' key={index}>
            <span>{dish}</span>
            <button className="btn btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
