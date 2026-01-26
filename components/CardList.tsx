import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CardData, CardType } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CardListProps {
    cards: CardData[];
    onSelectCard: (card: CardData) => void;
    onUpdateCard?: (card: CardData) => Promise<void>;
    saveStatus?: SaveStatus;
    isLoading: boolean;
}

interface EditingCell {
    cardId: string;
    key: keyof CardData;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
    key: keyof CardData | null;
    direction: SortDirection;
}

interface ColumnFilter {
    [key: string]: string;
}

// Column definitions
const COLUMNS: { key: keyof CardData; label: string; type: 'string' | 'number' | 'boolean' | 'enum'; width?: string }[] = [
    { key: 'title', label: 'Titre', type: 'string', width: '180px' },
    { key: 'type', label: 'Type', type: 'enum', width: '130px' },
    { key: 'level', label: 'Niveau', type: 'number', width: '80px' },
    { key: 'bonus', label: 'Bonus', type: 'number', width: '80px' },
    { key: 'description', label: 'Description', type: 'string', width: '200px' },
    { key: 'badStuff', label: 'Bad Stuff', type: 'string', width: '150px' },
    { key: 'gold', label: 'Trésors', type: 'string', width: '100px' },
    { key: 'itemSlot', label: 'Emplacement', type: 'string', width: '100px' },
    { key: 'isBig', label: 'Gros', type: 'boolean', width: '70px' },
    { key: 'restrictions', label: 'Restrictions', type: 'string', width: '120px' },
    { key: 'levelsGained', label: 'Niv. gagnés', type: 'number', width: '90px' },
    { key: 'isBaseCard', label: 'Base', type: 'boolean', width: '70px' },
    { key: 'isValidated', label: 'Validée', type: 'boolean', width: '80px' },
    { key: 'internalComment', label: 'Commentaire', type: 'string', width: '150px' },
];

const CardList: React.FC<CardListProps> = ({ cards, onSelectCard, onUpdateCard, saveStatus = 'idle', isLoading }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
    const [filters, setFilters] = useState<ColumnFilter>({});
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            if ('select' in inputRef.current) {
                inputRef.current.select();
            }
        }
    }, [editingCell]);

    // Handle sort
    const handleSort = (key: keyof CardData) => {
        setSortConfig(prev => {
            if (prev.key !== key) {
                return { key, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return { key: null, direction: null };
        });
    };

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // Filter and sort cards
    const processedCards = useMemo(() => {
        let result = [...cards];

        console.log('=== FILTER DEBUG ===');
        console.log('All filters:', filters);
        console.log('Initial cards count:', result.length);

        // Apply filters - each filter narrows down the results (AND logic)
        Object.entries(filters).forEach(([key, filterValue]: [string, string]) => {
            console.log(`Processing filter: key="${key}", value="${filterValue}"`);

            if (!filterValue || filterValue === 'all') {
                console.log('  -> Skipping (empty or "all")');
                return;
            }

            // Find the column definition to know the type
            const columnDef = COLUMNS.find(col => col.key === key);
            const columnType = columnDef?.type || 'string';
            console.log(`  -> Column type: ${columnType}`);

            const beforeCount = result.length;
            result = result.filter(card => {
                const value = card[key as keyof CardData];

                // Boolean filter
                if (columnType === 'boolean') {
                    if (filterValue === 'oui') {
                        return value === true;
                    }
                    if (filterValue === 'non') {
                        return value === false;
                    }
                    return true;
                }

                // Enum filter (exact match)
                if (columnType === 'enum') {
                    if (value === null || value === undefined) {
                        return false;
                    }
                    // Exact match for enum values
                    const match = String(value) === filterValue;
                    return match;
                }

                // String/number filter (partial match)
                if (value === null || value === undefined || value === '') {
                    return false;
                }
                const strValue = String(value).toLowerCase();
                const searchTerm = filterValue.toLowerCase();
                return strValue.includes(searchTerm);
            });
            console.log(`  -> Filtered: ${beforeCount} -> ${result.length} cards`);
        });

        console.log('Final cards count:', result.length);
        console.log('First 10 card types:', result.slice(0, 10).map(c => ({ title: c.title, type: c.type })));
        console.log('=== END FILTER DEBUG ===');

        // Apply sorting
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key!];
                const bVal = b[sortConfig.key!];

                // Handle null/undefined/empty values
                if (aVal === null || aVal === undefined || aVal === '') {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                if (bVal === null || bVal === undefined || bVal === '') {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }

                // Compare based on type
                if (typeof aVal === 'boolean') {
                    return sortConfig.direction === 'asc'
                        ? (aVal === bVal ? 0 : aVal ? -1 : 1)
                        : (aVal === bVal ? 0 : aVal ? 1 : -1);
                }

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }

                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();
                const comparison = aStr.localeCompare(bStr, 'fr');
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [cards, filters, sortConfig]);

    // Get sort icon
    const getSortIcon = (key: keyof CardData) => {
        if (sortConfig.key !== key) {
            return <span className="text-gray-300 ml-1">⇅</span>;
        }
        if (sortConfig.direction === 'asc') {
            return <span className="text-amber-600 ml-1">↑</span>;
        }
        return <span className="text-amber-600 ml-1">↓</span>;
    };

    // Start editing a cell
    const startEditing = (card: CardData, column: typeof COLUMNS[0]) => {
        const value = card[column.key];
        setEditingCell({ cardId: card.id, key: column.key });
        setEditValue(value === null || value === undefined ? '' : String(value));
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingCell(null);
        setEditValue('');
    };

    // Commit the edit and save
    const commitEdit = async (card: CardData, column: typeof COLUMNS[0]) => {
        if (!editingCell || !onUpdateCard) {
            cancelEditing();
            return;
        }

        let newValue: any = editValue;

        // Convert value based on column type
        if (column.type === 'number') {
            newValue = editValue === '' ? '' : Number(editValue);
        } else if (column.type === 'boolean') {
            newValue = editValue === 'true';
        }

        // Only save if value changed
        const oldValue = card[column.key];
        if (String(oldValue) !== String(newValue)) {
            const updatedCard = { ...card, [column.key]: newValue };
            try {
                await onUpdateCard(updatedCard);
            } catch (e) {
                console.error('Failed to save:', e);
            }
        }

        cancelEditing();
    };

    // Handle cell click
    const handleCellClick = (e: React.MouseEvent, card: CardData, column: typeof COLUMNS[0]) => {
        e.stopPropagation();

        // Title column opens the full editor
        if (column.key === 'title') {
            onSelectCard(card);
            return;
        }

        // Other columns start inline editing if onUpdateCard is provided
        if (onUpdateCard) {
            startEditing(card, column);
        }
    };

    // Handle key events in edit mode
    const handleEditKeyDown = (e: React.KeyboardEvent, card: CardData, column: typeof COLUMNS[0]) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commitEdit(card, column);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    };

    // Render editable input for a cell
    const renderEditInput = (card: CardData, column: typeof COLUMNS[0]) => {
        if (column.type === 'boolean') {
            return (
                <select
                    ref={inputRef as React.RefObject<HTMLSelectElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(card, column)}
                    onKeyDown={(e) => handleEditKeyDown(e, card, column)}
                    className="w-full px-1 py-0.5 text-sm border-2 border-amber-500 rounded bg-white focus:outline-none"
                >
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                </select>
            );
        }

        if (column.key === 'type') {
            return (
                <select
                    ref={inputRef as React.RefObject<HTMLSelectElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(card, column)}
                    onKeyDown={(e) => handleEditKeyDown(e, card, column)}
                    className="w-full px-1 py-0.5 text-sm border-2 border-amber-500 rounded bg-white focus:outline-none"
                >
                    {Object.values(CardType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            );
        }

        // For longer text fields, use textarea
        if (['description', 'badStuff', 'internalComment'].includes(column.key)) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(card, column)}
                    onKeyDown={(e) => handleEditKeyDown(e, card, column)}
                    rows={2}
                    className="w-full px-1 py-0.5 text-sm border-2 border-amber-500 rounded bg-white focus:outline-none resize-none"
                />
            );
        }

        // Default: text input
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={column.type === 'number' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(card, column)}
                onKeyDown={(e) => handleEditKeyDown(e, card, column)}
                className="w-full px-1 py-0.5 text-sm border-2 border-amber-500 rounded bg-white focus:outline-none"
            />
        );
    };

    // Render cell value (display mode or edit mode)
    const renderCellValue = (card: CardData, column: typeof COLUMNS[0]) => {
        // Check if this cell is being edited
        const isEditing = editingCell?.cardId === card.id && editingCell?.key === column.key;

        if (isEditing) {
            return renderEditInput(card, column);
        }

        const value = card[column.key];

        if (column.type === 'boolean') {
            return value ? (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">✓</span>
            ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">–</span>
            );
        }

        if (value === null || value === undefined || value === '') {
            return <span className="text-gray-300 italic">–</span>;
        }

        if (column.key === 'type') {
            return (
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium truncate max-w-full">
                    {String(value)}
                </span>
            );
        }

        // Title column shows as a link-like element
        if (column.key === 'title') {
            return (
                <span className="truncate block text-amber-700 hover:text-amber-900 font-medium cursor-pointer" title={String(value)}>
                    {String(value)}
                </span>
            );
        }

        return <span className="truncate block" title={String(value)}>{String(value)}</span>;
    };

    // Render filter input
    const renderFilterInput = (column: typeof COLUMNS[0]) => {
        const filterValue = filters[column.key] || '';

        if (column.type === 'boolean') {
            return (
                <select
                    value={filterValue}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="w-full px-1 py-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="all">Tous</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                </select>
            );
        }

        if (column.key === 'type') {
            return (
                <select
                    value={filterValue}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="w-full px-1 py-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="all">Tous</option>
                    {Object.values(CardType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type="text"
                value={filterValue}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                placeholder="Filtrer..."
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        setSortConfig({ key: null, direction: null });
    };

    const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

    return (
        <div className="min-h-full flex flex-col">
            {/* Header bar */}
            <div className="sticky top-0 z-20 bg-stone-100/95 backdrop-blur-sm px-4 py-3 border-b border-stone-300 shadow-sm">
                <div className="max-w-full mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">📋</span>
                        <h2 className="text-lg font-bold text-gray-800">
                            Liste des cartes
                        </h2>
                        <span className="text-sm text-gray-500">
                            ({processedCards.length} / {cards.length} carte{cards.length !== 1 ? 's' : ''})
                        </span>
                        {/* Save status indicator */}
                        {onUpdateCard && (
                            <div className="flex items-center gap-1.5 ml-2" title={
                                saveStatus === 'saving' ? 'Sauvegarde en cours...' :
                                    saveStatus === 'saved' ? 'Sauvegardé' :
                                        saveStatus === 'error' ? 'Erreur de sauvegarde' :
                                            'Synchronisé'
                            }>
                                {saveStatus === 'saving' ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                                ) : saveStatus === 'saved' ? (
                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : saveStatus === 'error' ? (
                                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                )}
                                <span className={`text-xs ${saveStatus === 'saving' ? 'text-amber-600' :
                                    saveStatus === 'saved' ? 'text-green-600' :
                                        saveStatus === 'error' ? 'text-red-500' :
                                            'text-gray-400'
                                    }`}>
                                    {saveStatus === 'saving' ? 'Sauvegarde...' :
                                        saveStatus === 'saved' ? 'Sauvegardé' :
                                            saveStatus === 'error' ? 'Erreur' :
                                                ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Effacer les filtres
                        </button>
                    )}
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
                        <p className="text-gray-600 font-medium">Chargement des cartes...</p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && cards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="text-6xl mb-4">🃏</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune carte créée</h3>
                    <p className="text-gray-500 text-center max-w-md">
                        Commencez par créer votre première carte Munchkin !
                    </p>
                </div>
            )}

            {/* No results */}
            {!isLoading && cards.length > 0 && processedCards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun résultat</h3>
                    <p className="text-gray-500 text-center mb-4">
                        Aucune carte ne correspond aux filtres actifs.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-amber-600 hover:text-amber-700 font-medium underline"
                    >
                        Effacer les filtres
                    </button>
                </div>
            )}

            {/* Table */}
            {!isLoading && processedCards.length > 0 && (
                <div className="flex-grow overflow-auto p-4">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                {/* Header row */}
                                <thead>
                                    <tr className="bg-amber-800 text-white">
                                        {COLUMNS.map(column => (
                                            <th
                                                key={column.key}
                                                onClick={() => handleSort(column.key)}
                                                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-amber-700 transition-colors select-none whitespace-nowrap"
                                                style={{ minWidth: column.width }}
                                            >
                                                <div className="flex items-center">
                                                    <span>{column.label}</span>
                                                    {getSortIcon(column.key)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Filter row */}
                                    <tr className="bg-amber-50 border-b-2 border-amber-200">
                                        {COLUMNS.map(column => (
                                            <th key={`filter-${column.key}`} className="px-2 py-2">
                                                {renderFilterInput(column)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                {/* Body */}
                                <tbody>
                                    {processedCards.map((card, index) => (
                                        <tr
                                            key={card.id}
                                            className={`
                                                transition-colors border-b border-gray-100
                                                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                                hover:bg-amber-50
                                            `}
                                        >
                                            {COLUMNS.map(column => (
                                                <td
                                                    key={`${card.id}-${column.key}`}
                                                    onClick={(e) => handleCellClick(e, card, column)}
                                                    className={`px-3 py-2.5 max-w-[200px] ${column.key === 'title'
                                                            ? 'cursor-pointer'
                                                            : onUpdateCard
                                                                ? 'cursor-text hover:bg-amber-100/50'
                                                                : ''
                                                        }`}
                                                >
                                                    {renderCellValue(card, column)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardList;
