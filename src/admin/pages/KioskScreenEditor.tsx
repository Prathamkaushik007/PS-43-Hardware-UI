import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Upload, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { configService } from '../services/configurationService';
import type { KioskConfiguration, KioskScreenConfig, ScreenOption } from '../types';

const DEFAULT_CONFIG: KioskScreenConfig = {
  heading: { hi: 'शिकायत दर्ज करें', en: 'Register Grievance' },
  subheading: { hi: 'अपना तरीका चुनें', en: 'Choose your method' },
  options: []
};

export function KioskScreenEditor() {
  const { kioskId } = useParams<{ kioskId: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<KioskConfiguration | null>(null);
  const [draftConfig, setDraftConfig] = useState<KioskScreenConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kioskId) {
      loadConfig(kioskId);
    }
  }, [kioskId]);

  const loadConfig = async (id: string) => {
    setLoading(true);
    try {
      let existingConfig = await configService.getConfiguration(id);
      if (existingConfig) {
        setConfig(existingConfig);
        setDraftConfig(existingConfig.config);
      } else {
        const newConfig: KioskConfiguration = {
          kioskId: id,
          version: 1,
          config: DEFAULT_CONFIG,
          status: 'draft',
          updatedAt: new Date().toISOString()
        };
        setConfig(newConfig);
        setDraftConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!config || !kioskId) return;
    try {
      await configService.saveDraft({ ...config, config: draftConfig });
      alert('Draft saved successfully');
      loadConfig(kioskId);
    } catch (err) {
      alert('Error saving draft');
    }
  };

  const handlePublish = async () => {
    if (!config || !kioskId) return;
    try {
      await configService.publish({ ...config, config: draftConfig, version: config.version + 1 });
      alert('Configuration published successfully');
      loadConfig(kioskId);
    } catch (err) {
      alert('Error publishing configuration');
    }
  };
  
  const handleApplyToAll = async () => {
    if (!config) return;
    if (confirm('Are you sure you want to apply this configuration to ALL active kiosks?')) {
      try {
        await configService.applyToAll({ ...config, config: draftConfig, version: config.version + 1 });
        alert('Configuration applied to all active kiosks successfully');
      } catch (err) {
        alert('Error applying configuration');
      }
    }
  };

  const addOption = () => {
    const newOption: ScreenOption = {
      id: crypto.randomUUID(),
      title: { en: 'New Option', hi: 'नया विकल्प' },
      enabled: true,
      displayOrder: draftConfig.options.length,
      actionType: 'NONE'
    };
    setDraftConfig(prev => ({ ...prev, options: [...prev.options, newOption] }));
  };

  const updateOption = (index: number, field: string, subfield: string | null, value: any) => {
    const newOptions = [...draftConfig.options];
    if (subfield) {
      (newOptions[index] as any)[field][subfield] = value;
    } else {
      (newOptions[index] as any)[field] = value;
    }
    setDraftConfig(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = [...draftConfig.options];
    newOptions.splice(index, 1);
    setDraftConfig(prev => ({ ...prev, options: newOptions }));
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= draftConfig.options.length) return;
    const newOptions = [...draftConfig.options];
    const temp = newOptions[index];
    newOptions[index] = newOptions[index + direction];
    newOptions[index + direction] = temp;
    
    // Update displayOrder
    newOptions.forEach((opt, i) => { opt.displayOrder = i; });
    setDraftConfig(prev => ({ ...prev, options: newOptions }));
  };

  if (loading) return <div>Loading editor...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/kiosks')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Editor: {kioskId}</h2>
          {config && (
            <span style={{
              padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem',
              backgroundColor: config.status === 'published' ? '#064e3b' : '#7f1d1d',
              color: config.status === 'published' ? '#34d399' : '#fca5a5'
            }}>
              {config.status.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleSaveDraft} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <Save size={16} /> Save Draft
          </button>
          <button onClick={handlePublish} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#059669', color: 'white', cursor: 'pointer' }}>
            <Upload size={16} /> Publish
          </button>
          <button onClick={handleApplyToAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#b91c1c', color: 'white', cursor: 'pointer' }}>
            Apply to All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        {/* Editor Form */}
        <div style={{ flex: '1', backgroundColor: 'var(--bg-card-dark)', padding: '1.5rem', borderRadius: '0.5rem', overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Headings</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Heading (English)</label>
                <input type="text" value={draftConfig.heading.en} onChange={(e) => setDraftConfig(prev => ({ ...prev, heading: { ...prev.heading, en: e.target.value } }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Heading (Hindi)</label>
                <input type="text" value={draftConfig.heading.hi} onChange={(e) => setDraftConfig(prev => ({ ...prev, heading: { ...prev.heading, hi: e.target.value } }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Screen Options</h3>
              <button onClick={addOption} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.875rem' }}>
                <Plus size={14} /> Add Option
              </button>
            </div>
            
            {draftConfig.options.map((opt, index) => (
              <div key={opt.id} style={{ backgroundColor: 'var(--border-subtle)', padding: '1rem', borderRadius: '0.25rem', marginBottom: '1rem', position: 'relative' }}>
                <div style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => moveOption(index, -1)} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? '#4b5563' : 'white', cursor: index === 0 ? 'default' : 'pointer' }}><ChevronUp size={16} /></button>
                  <button onClick={() => moveOption(index, 1)} disabled={index === draftConfig.options.length - 1} style={{ background: 'none', border: 'none', color: index === draftConfig.options.length - 1 ? '#4b5563' : 'white', cursor: index === draftConfig.options.length - 1 ? 'default' : 'pointer' }}><ChevronDown size={16} /></button>
                  <button onClick={() => removeOption(index)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', marginLeft: '0.5rem' }}><Trash2 size={16} /></button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Title (EN)</label>
                    <input type="text" value={opt.title.en} onChange={(e) => updateOption(index, 'title', 'en', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.875rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Title (HI)</label>
                    <input type="text" value={opt.title.hi} onChange={(e) => updateOption(index, 'title', 'hi', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.875rem' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action Type</label>
                    <select value={opt.actionType} onChange={(e) => updateOption(index, 'actionType', null, e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.875rem' }}>
                      <option value="NONE">None</option>
                      <option value="VIDEO">Video Recording</option>
                      <option value="AUDIO">Audio Recording</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <input type="checkbox" checked={opt.enabled} onChange={(e) => updateOption(index, 'enabled', null, e.target.checked)} id={`enable-${opt.id}`} />
                    <label htmlFor={`enable-${opt.id}`} style={{ fontSize: '0.875rem' }}>Enabled on Screen</label>
                  </div>
                </div>
              </div>
            ))}
            {draftConfig.options.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No options added. Add one above.</p>
            )}
          </div>
        </div>

        {/* Live Preview Pane */}
        <div style={{ flex: '1', backgroundColor: '#000', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: '2px solid var(--border-subtle)' }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', borderRadius: '0.25rem', zIndex: 10 }}>Live Preview</div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem', textAlign: 'center' }}>{draftConfig.heading.en}</h1>
            <h2 style={{ fontSize: '1.8rem', color: '#fcd34d', marginBottom: '3rem', textAlign: 'center' }}>{draftConfig.heading.hi}</h2>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              {draftConfig.options.filter(o => o.enabled).map(opt => (
                <div key={opt.id} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', padding: '2rem', borderRadius: '1rem', width: '250px', textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{opt.title.en}</div>
                  <div style={{ fontSize: '1.2rem', color: '#9ca3af' }}>{opt.title.hi}</div>
                  <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase' }}>Action: {opt.actionType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
