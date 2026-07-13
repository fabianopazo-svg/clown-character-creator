import { useEffect, useState } from 'react';
import { fetchFile, saveFile } from '../api';

export default function CoreEditor() {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchFile('core.json').then(data => setText(JSON.stringify(data, null, 2)));
  }, []);

  const handleChange = (value) => {
    setText(value);
    setDirty(true);
    try {
      JSON.parse(value);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      alert('Not valid JSON — fix the syntax error before saving:\n' + err.message);
      return;
    }
    setSaving(true);
    try {
      await saveFile('core.json', parsed);
      setDirty(false);
      alert('Saved to src/data/core.json');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <p className="helper-text">
        Core rules constants (Attributes, Skills, age bands, ranks, personality traits, the glossary
        page content) — edited as raw JSON since this file is mostly game constants rather than
        repeatable content entries. Be careful with commas and brackets.
      </p>
      {error && (
        <p style={{ color: '#c0392b', fontSize: 12, marginBottom: 8 }}>Invalid JSON: {error}</p>
      )}
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        rows={32}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
      />
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty || !!error}>
          {saving ? 'Saving…' : dirty ? 'Save core.json to disk' : 'No changes'}
        </button>
      </div>
    </div>
  );
}
