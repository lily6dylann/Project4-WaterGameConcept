import React from 'react';

export default function Header() {
  return (
    <header className="app-header" style={{ background: '#f7c948', color: '#0077c2', padding: '1em' }}>
      <span role="img" aria-label="water drop">💧</span>
      <span style={{ fontWeight: 'bold', fontSize: '2em', marginLeft: '0.5em' }}>WordFlow</span>
      <div style={{ fontSize: '1em', marginTop: '0.5em' }}>
        <em>Every word helps spread awareness for clean water!</em>
      </div>
    </header>
  );
}