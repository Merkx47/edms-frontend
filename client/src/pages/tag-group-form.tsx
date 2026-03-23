import { MdAdd, MdArrowBack, MdCheckCircle, MdClose, MdDelete, MdDns, MdLabel, MdLayers, MdPublic, MdSearch } from 'react-icons/md';
import { useState, useCallback, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataStore, type ValueType, type TagKey, type TagGroupScope } from '@/lib/data-store';
import { useFinOpsStore } from '@/lib/finops-store';
import { generateResources, generateAllVDCHierarchies, flattenVDCTree } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const GROUP_COLORS = [
  '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#E53935', '#00ACC1', '#6D4C41', '#546E7A',
];

const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  string: 'STR', int: 'INT', float: 'FLT', bool: 'BOOL',
  date: 'DATE', json: 'JSON', list: 'LIST', enum: 'ENUM',
};

const VALUE_TYPE_HINTS: Record<ValueType, string> = {
  string: 'e.g. "production-web-01"',
  int: 'e.g. 42',
  float: 'e.g. 3.14',
  bool: 'Accepts true or false only',
  date: 'e.g. 2026-01-15',
  json: 'Key-value pairs stored as JSON',
  list: 'Comma-separated list of allowed values',
  enum: 'Comma-separated list of allowed values',
};

export default function TagGroupForm() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute('/tags/edit/:id');
  const editId = editParams?.id;

  const { tagGroups, addTagGroup, updateTagGroup, getTagGroup } = useDataStore();
  const { selectedTenantId, selectedRegion } = useFinOpsStore();

  // Load existing group if editing
  const existingGroup = editId ? getTagGroup(editId) : undefined;

  // Form state
  const [formName, setFormName] = useState(existingGroup?.name || '');
  const [formDescription, setFormDescription] = useState(existingGroup?.description || '');
  const [formColor, setFormColor] = useState(existingGroup?.color || GROUP_COLORS[0]);
  const [formTags, setFormTags] = useState<TagKey[]>(
    existingGroup?.tags.map(t => ({ ...t })) || []
  );
  const [formScope, setFormScope] = useState<TagGroupScope>(existingGroup?.scope || 'all');
  const [formScopeTargets, setFormScopeTargets] = useState<string[]>(existingGroup?.scopeTargets || []);

  // Chip input for enum/list types
  const [chipInputValues, setChipInputValues] = useState<Record<string, string>>({});

  // JSON pairs state
  const [jsonPairs, setJsonPairs] = useState<Record<string, { key: string; value: string }[]>>(() => {
    if (!existingGroup) return {};
    const pairs: Record<string, { key: string; value: string }[]> = {};
    existingGroup.tags.forEach(t => {
      if (t.valueType === 'json' && t.allowedValues) {
        try {
          pairs[t.id] = Object.entries(JSON.parse(t.allowedValues)).map(([k, v]) => ({ key: k, value: String(v) }));
        } catch { /* ignore */ }
      }
    });
    return pairs;
  });

  // Scope search
  const [scopeSearch, setScopeSearch] = useState('');

  // VDC and resource data for scope selector
  const allVDCHierarchies = useMemo(() => generateAllVDCHierarchies(selectedTenantId), [selectedTenantId]);
  const allVDCs = useMemo(() => allVDCHierarchies.flatMap(h => flattenVDCTree(h)), [allVDCHierarchies]);
  const allResources = useMemo(() => generateResources(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);

  const filteredVDCs = useMemo(() => {
    if (!scopeSearch) return allVDCs;
    const q = scopeSearch.toLowerCase();
    return allVDCs.filter(v => v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
  }, [allVDCs, scopeSearch]);

  const filteredResources = useMemo(() => {
    if (!scopeSearch) return allResources.slice(0, 50);
    const q = scopeSearch.toLowerCase();
    return allResources.filter(r => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)).slice(0, 50);
  }, [allResources, scopeSearch]);

  // Tag key helpers
  const addFormTag = useCallback(() => {
    setFormTags(prev => [
      ...prev,
      { id: `new-${Date.now()}-${prev.length}`, key: '', valueType: 'string', required: true, allowedValues: '', description: '' },
    ]);
  }, []);

  const removeFormTag = useCallback((id: string) => {
    setFormTags(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateFormTag = useCallback((id: string, field: keyof TagKey, value: string | boolean) => {
    setFormTags(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);

  const handleChipKeyDown = useCallback(
    (tagId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
      const inputVal = chipInputValues[tagId]?.trim() || '';
      if (e.key === 'Enter' && inputVal) {
        e.preventDefault();
        setFormTags(prev =>
          prev.map(t => {
            if (t.id !== tagId) return t;
            const existing = t.allowedValues ? t.allowedValues.split(',').map(s => s.trim()).filter(Boolean) : [];
            if (existing.includes(inputVal)) return t;
            return { ...t, allowedValues: [...existing, inputVal].join(',') };
          })
        );
        setChipInputValues(prev => ({ ...prev, [tagId]: '' }));
      }
      if (e.key === 'Backspace' && !inputVal) {
        setFormTags(prev =>
          prev.map(t => {
            if (t.id !== tagId) return t;
            const existing = t.allowedValues ? t.allowedValues.split(',').map(s => s.trim()).filter(Boolean) : [];
            return { ...t, allowedValues: existing.slice(0, -1).join(',') };
          })
        );
      }
    },
    [chipInputValues]
  );

  const removeChip = useCallback((tagId: string, chipVal: string) => {
    setFormTags(prev =>
      prev.map(t => {
        if (t.id !== tagId) return t;
        const existing = t.allowedValues.split(',').map(s => s.trim()).filter(Boolean);
        return { ...t, allowedValues: existing.filter(v => v !== chipVal).join(',') };
      })
    );
  }, []);

  // Scope toggle
  const toggleScopeTarget = useCallback((id: string) => {
    setFormScopeTargets(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  // Save
  const handleSave = useCallback(() => {
    if (!formName.trim()) return;
    const finalTags = formTags.map(t => {
      if (t.valueType === 'json' && jsonPairs[t.id]) {
        const obj: Record<string, string> = {};
        jsonPairs[t.id].forEach(p => { if (p.key.trim()) obj[p.key.trim()] = p.value; });
        return { ...t, allowedValues: JSON.stringify(obj) };
      }
      return t;
    });
    if (editId && existingGroup) {
      updateTagGroup(editId, {
        name: formName,
        description: formDescription,
        color: formColor,
        tags: finalTags,
        scope: formScope,
        scopeTargets: formScopeTargets,
      });
    } else {
      addTagGroup({
        name: formName,
        description: formDescription,
        color: formColor,
        tags: finalTags,
        scope: formScope,
        scopeTargets: formScopeTargets,
      });
    }
    setLocation('/tags');
  }, [editId, existingGroup, formName, formDescription, formColor, formTags, jsonPairs, formScope, formScopeTargets, setLocation, addTagGroup, updateTagGroup]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/tags')}>
              <MdArrowBack className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{editId ? 'Edit Tag Group' : 'Create Tag Group'}</h1>
              <p className="text-sm text-muted-foreground">
                {editId ? 'Update the tag group configuration and its tag keys.' : 'Define a new tag group with required and optional tag keys.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation('/tags')}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editId ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* === Section 1: Basic Info === */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="group-name" className="text-sm font-medium">Group Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="group-name"
                    placeholder="e.g. Environment Classification"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="group-desc" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="group-desc"
                    placeholder="Describe the purpose of this tag group..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Color</Label>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-muted/50 border">
                  {GROUP_COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        'h-8 w-8 rounded-full transition-all',
                        formColor === c
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === Section 2: Tag Keys === */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tag Keys</h2>
              <Button variant="outline" size="sm" onClick={addFormTag}>
                <MdAdd className="h-3.5 w-3.5 mr-1" /> Add Key
              </Button>
            </div>

            {formTags.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/15 rounded-lg">
                <MdLabel className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No tag keys defined yet</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Tag keys define the metadata fields resources must have</p>
                <Button variant="outline" size="sm" onClick={addFormTag}>
                  <MdAdd className="h-3.5 w-3.5 mr-1" /> Add First Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formTags.map((tk, ti) => (
                  <div key={tk.id} className="rounded-lg border bg-muted/20 p-4 space-y-3 relative">
                    {/* Key number badge */}
                    <Badge variant="outline" className="absolute -top-2.5 left-3 bg-background text-[10px] px-2">
                      KEY {ti + 1}
                    </Badge>

                    {/* Row 1: Key name, type, delete */}
                    <div className="grid grid-cols-[1fr,160px,auto] gap-3 items-end pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Key Name</Label>
                        <Input
                          className="h-9 text-sm font-mono"
                          placeholder="e.g. environment"
                          value={tk.key}
                          onChange={e => updateFormTag(tk.id, 'key', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Value Type</Label>
                        <Select value={tk.valueType} onValueChange={(v: ValueType) => updateFormTag(tk.id, 'valueType', v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(VALUE_TYPE_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>
                                <span className="font-mono text-xs mr-2 opacity-50">{label}</span> {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeFormTag(tk.id)}>
                        <MdDelete className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Row 2: Value input based on data type */}
                    {tk.valueType === 'string' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          className="h-9 text-sm"
                          placeholder="e.g. production-web-01"
                          value={tk.allowedValues}
                          onChange={e => updateFormTag(tk.id, 'allowedValues', e.target.value)}
                        />
                      </div>
                    )}
                    {tk.valueType === 'int' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          className="h-9 text-sm font-mono"
                          type="number"
                          step="1"
                          placeholder="e.g. 42"
                          value={tk.allowedValues}
                          onChange={e => updateFormTag(tk.id, 'allowedValues', e.target.value)}
                        />
                      </div>
                    )}
                    {tk.valueType === 'float' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          className="h-9 text-sm font-mono"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 3.14"
                          value={tk.allowedValues}
                          onChange={e => updateFormTag(tk.id, 'allowedValues', e.target.value)}
                        />
                      </div>
                    )}
                    {tk.valueType === 'date' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          className="h-9 text-sm"
                          type="date"
                          value={tk.allowedValues}
                          onChange={e => updateFormTag(tk.id, 'allowedValues', e.target.value)}
                        />
                      </div>
                    )}
                    {tk.valueType === 'bool' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Select value={tk.allowedValues || ''} onValueChange={(v) => updateFormTag(tk.id, 'allowedValues', v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select true or false" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">true</SelectItem>
                            <SelectItem value="false">false</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Row 3: Description */}
                    <div className="space-y-1">
                      <Label className="text-xs">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Brief description of this tag key..."
                        value={tk.description}
                        onChange={e => updateFormTag(tk.id, 'description', e.target.value)}
                      />
                    </div>

                    {/* Enum/List chip input */}
                    {(tk.valueType === 'enum' || tk.valueType === 'list') && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Allowed Values</Label>
                        <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md bg-background min-h-[36px]">
                          {tk.allowedValues && tk.allowedValues.split(',').filter(Boolean).map(chip => (
                            <Badge key={chip} variant="secondary" className="text-xs gap-1 pr-1 h-6">
                              {chip.trim()}
                              <button onClick={() => removeChip(tk.id, chip.trim())} className="hover:text-destructive">
                                <MdClose className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Input
                            className="h-6 text-xs border-none shadow-none p-0 flex-1 min-w-[100px] focus-visible:ring-0"
                            placeholder="Type and press Enter..."
                            value={chipInputValues[tk.id] || ''}
                            onChange={e => setChipInputValues(prev => ({ ...prev, [tk.id]: e.target.value }))}
                            onKeyDown={e => handleChipKeyDown(tk.id, e)}
                          />
                        </div>
                      </div>
                    )}

                    {/* JSON key-value builder */}
                    {tk.valueType === 'json' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Key-Value Pairs</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => {
                              setJsonPairs(prev => ({
                                ...prev,
                                [tk.id]: [...(prev[tk.id] || []), { key: '', value: '' }],
                              }));
                            }}
                          >
                            <MdAdd className="h-3 w-3 mr-1" /> Add Pair
                          </Button>
                        </div>

                        {(!jsonPairs[tk.id] || jsonPairs[tk.id].length === 0) && (
                          <div className="text-center py-3 border border-dashed rounded-md text-xs text-muted-foreground">
                            No key-value pairs. Click "Add Pair" to start.
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {(jsonPairs[tk.id] || []).map((pair, pi) => (
                            <div key={pi} className="flex items-center gap-2">
                              <Input className="h-8 text-xs font-mono flex-1" placeholder="key" value={pair.key}
                                onChange={e => {
                                  setJsonPairs(prev => {
                                    const updated = [...(prev[tk.id] || [])];
                                    updated[pi] = { ...updated[pi], key: e.target.value };
                                    return { ...prev, [tk.id]: updated };
                                  });
                                }}
                              />
                              <span className="text-muted-foreground text-xs">:</span>
                              <Input className="h-8 text-xs font-mono flex-1" placeholder="value" value={pair.value}
                                onChange={e => {
                                  setJsonPairs(prev => {
                                    const updated = [...(prev[tk.id] || [])];
                                    updated[pi] = { ...updated[pi], value: e.target.value };
                                    return { ...prev, [tk.id]: updated };
                                  });
                                }}
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                                onClick={() => setJsonPairs(prev => ({ ...prev, [tk.id]: (prev[tk.id] || []).filter((_, i) => i !== pi) }))}
                              >
                                <MdClose className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {jsonPairs[tk.id] && jsonPairs[tk.id].length > 0 && (
                          <pre className="text-[10px] bg-muted/50 p-2 rounded font-mono text-muted-foreground overflow-x-auto">
                            {JSON.stringify(
                              (jsonPairs[tk.id] || []).reduce<Record<string, string>>((obj, p) => { if (p.key.trim()) obj[p.key.trim()] = p.value; return obj; }, {}),
                              null, 2
                            )}
                          </pre>
                        )}
                      </div>
                    )}

                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addFormTag} className="w-full border-dashed">
                  <MdAdd className="h-3.5 w-3.5 mr-1" /> Add Another Key
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* === Section 3: Scope Assignment === */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Scope Assignment</h2>

            {/* Scope type selector - card-based */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: 'all' as const, icon: MdPublic, label: 'All Resources', desc: 'Applies globally to every resource' },
                { value: 'vdc' as const, icon: MdLayers, label: 'Specific VDCs', desc: 'Target specific VDC hierarchies' },
                { value: 'resource' as const, icon: MdDns, label: 'Specific Resources', desc: 'Target individual resources' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFormScope(opt.value); setFormScopeTargets([]); setScopeSearch(''); }}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all',
                    formScope === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <opt.icon className={cn('h-5 w-5 mb-2', formScope === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* VDC selector */}
            {formScope === 'vdc' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select VDCs to apply this tag group to ({formScopeTargets.length} selected)
                  </p>
                  {formScopeTargets.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setFormScopeTargets([])}>
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Search VDCs..."
                    value={scopeSearch}
                    onChange={e => setScopeSearch(e.target.value)}
                  />
                </div>

                {/* Selected chips */}
                {formScopeTargets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formScopeTargets.map(id => {
                      const vdc = allVDCs.find(v => v.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                          {vdc?.name || id}
                          <button onClick={() => toggleScopeTarget(id)} className="ml-1 hover:text-destructive">
                            <MdClose className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* VDC list */}
                <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
                  {filteredVDCs.map(vdc => {
                    const isSelected = formScopeTargets.includes(vdc.id);
                    return (
                      <button
                        key={vdc.id}
                        onClick={() => toggleScopeTarget(vdc.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded border flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                        )}>
                          {isSelected && <MdCheckCircle className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{vdc.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {vdc.level.toUpperCase()} &middot; {vdc.resources} resources &middot; {vdc.id}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">{vdc.level.toUpperCase()}</Badge>
                      </button>
                    );
                  })}
                  {filteredVDCs.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No VDCs match your search</div>
                  )}
                </div>
              </div>
            )}

            {/* Resource selector */}
            {formScope === 'resource' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select resources to apply this tag group to ({formScopeTargets.length} selected)
                  </p>
                  {formScopeTargets.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setFormScopeTargets([])}>
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Search resources by name or ID..."
                    value={scopeSearch}
                    onChange={e => setScopeSearch(e.target.value)}
                  />
                </div>

                {/* Selected chips */}
                {formScopeTargets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formScopeTargets.map(id => {
                      const res = allResources.find(r => r.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                          {res?.name || id}
                          <button onClick={() => toggleScopeTarget(id)} className="ml-1 hover:text-destructive">
                            <MdClose className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Resource list */}
                <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
                  {filteredResources.map(res => {
                    const isSelected = formScopeTargets.includes(res.id);
                    return (
                      <button
                        key={res.id}
                        onClick={() => toggleScopeTarget(res.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded border flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                        )}>
                          {isSelected && <MdCheckCircle className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{res.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {res.service} &middot; {res.region} &middot; {res.id}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">{res.service}</Badge>
                      </button>
                    );
                  })}
                  {filteredResources.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No resources match your search</div>
                  )}
                  {!scopeSearch && allResources.length > 50 && (
                    <div className="text-center py-2 text-xs text-muted-foreground bg-muted/30">
                      Showing first 50 of {allResources.length} resources. Use search to find more.
                    </div>
                  )}
                </div>
              </div>
            )}

            {formScope === 'all' && (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <MdPublic className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">This tag group will apply to all resources across all VDCs.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom actions (mobile-friendly) */}
        <div className="flex items-center justify-between pb-6">
          <p className="text-xs text-muted-foreground">
            {formTags.length} key{formTags.length !== 1 ? 's' : ''} defined
            {formTags.filter(t => t.required).length > 0 && (
              <span> &middot; {formTags.filter(t => t.required).length} required</span>
            )}
            {formScope !== 'all' && (
              <span> &middot; {formScopeTargets.length} {formScope === 'vdc' ? 'VDCs' : 'resources'} targeted</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation('/tags')}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editId ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
