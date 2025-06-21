// ERD Designer Application
class ERDDesigner {
    constructor() {
        this.tables = new Map();
        this.relations = [];
        this.selectedTable = null;
        this.selectedRelation = null;
        this.draggedTable = null;
        this.isCreatingRelation = false;
        this.relationStart = null;
        this.editingTableId = null; // Track which table is being edited
        this.currentProject = {
            name: 'Untitled Project',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        // Zoom functionality
        this.zoomLevel = 1;
        this.minZoom = 0.25;
        this.maxZoom = 3;
        this.zoomStep = 0.25;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.updateSidebar();
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('addTableBtn').addEventListener('click', () => this.showTableModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportERD());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadProjectBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('newProjectBtn').addEventListener('click', () => this.newProject());
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.hideTableModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideTableModal());
        document.getElementById('saveTableBtn').addEventListener('click', () => this.saveTable());
        document.getElementById('addColumnBtn').addEventListener('click', () => this.addColumnForm());

        // Relation modal events
        document.getElementById('closeRelationModal').addEventListener('click', () => this.hideRelationModal());
        document.getElementById('cancelRelationBtn').addEventListener('click', () => this.hideRelationModal());
        document.getElementById('saveRelationBtn').addEventListener('click', () => this.saveRelation());

        // Form events
        document.getElementById('fromTable').addEventListener('change', () => this.updateColumnOptions('from'));
        document.getElementById('toTable').addEventListener('change', () => this.updateColumnOptions('to'));

        // Canvas events
        document.getElementById('canvas').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.deselectAll();
                // Remove any existing context menus
                const existingMenu = document.querySelector('.relation-context-menu');
                if (existingMenu) existingMenu.remove();
            }
        });

        // Modal backdrop click
        document.getElementById('tableModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideTableModal();
        });
        document.getElementById('relationModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideRelationModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTableModal();
                this.hideRelationModal();
                this.deselectAll();
            }
            if (e.key === 'Delete' && this.selectedTable) {
                this.deleteTable(this.selectedTable);
            }
            // Zoom shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    this.zoomIn();
                }
                if (e.key === '-') {
                    e.preventDefault();
                    this.zoomOut();
                }
                if (e.key === '0') {
                    e.preventDefault();
                    this.resetZoom();
                }
            }
        });
        
        // Mouse wheel zoom
        document.getElementById('canvas').addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });
    }

    setupCanvas() {
        const svg = document.getElementById('relationSvg');
        const canvas = document.getElementById('canvas');
        
        // Create arrow marker for relations
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 8 3, 0 6');
        polygon.setAttribute('fill', '#4f46e5');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        
        // Setup canvas panning functionality
        this.setupCanvasPanning();
    }
    
    setupCanvasPanning() {
        const canvas = document.getElementById('canvas');
        let isPanning = false;
        let startX, startY, scrollLeft, scrollTop;
        let isHandMode = false;
        
        // Check if hand button already exists to prevent duplication
        let handBtn = document.getElementById('handModeBtn');
        if (!handBtn) {
            // Add hand mode toggle button
            handBtn = document.createElement('button');
            handBtn.id = 'handModeBtn';
            handBtn.className = 'btn btn-secondary hand-mode-btn';
            handBtn.innerHTML = '<span class="icon">✋</span> Hand';
            handBtn.title = 'Toggle Hand Mode (H)';
            
            // Insert hand button after add table button
            const addTableBtn = document.getElementById('addTableBtn');
            addTableBtn.parentNode.insertBefore(handBtn, addTableBtn.nextSibling);
        }
        
        // Remove existing event listeners to prevent duplication
        const newHandBtn = handBtn.cloneNode(true);
        handBtn.parentNode.replaceChild(newHandBtn, handBtn);
        handBtn = newHandBtn;
        
        handBtn.addEventListener('click', () => {
            isHandMode = !isHandMode;
            canvas.classList.toggle('hand-mode', isHandMode);
            handBtn.classList.toggle('active', isHandMode);
        });
        
        // Remove existing keyboard listeners and add new one
        if (this.handModeKeyListener) {
            document.removeEventListener('keydown', this.handModeKeyListener);
        }
        
        this.handModeKeyListener = (e) => {
            if (e.key === 'h' || e.key === 'H') {
                if (!e.target.matches('input, textarea, select')) {
                    e.preventDefault();
                    handBtn.click();
                }
            }
        };
        
        document.addEventListener('keydown', this.handModeKeyListener);
        
        // Remove existing canvas event listeners to prevent duplication
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        const updatedCanvas = document.getElementById('canvas');
        
        // Re-add canvas click event for deselecting
        updatedCanvas.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.deselectAll();
                // Remove any existing context menus
                const existingMenu = document.querySelector('.relation-context-menu');
                if (existingMenu) existingMenu.remove();
            }
        });
        
        updatedCanvas.addEventListener('mousedown', (e) => {
            if (isHandMode || e.button === 1) { // Middle mouse button or hand mode
                isPanning = true;
                startX = e.pageX - updatedCanvas.offsetLeft;
                startY = e.pageY - updatedCanvas.offsetTop;
                scrollLeft = updatedCanvas.scrollLeft;
                scrollTop = updatedCanvas.scrollTop;
                updatedCanvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        updatedCanvas.addEventListener('mousemove', (e) => {
            if (!isPanning) {
                if (isHandMode) {
                    updatedCanvas.style.cursor = 'grab';
                }
                return;
            }
            
            e.preventDefault();
            const x = e.pageX - updatedCanvas.offsetLeft;
            const y = e.pageY - updatedCanvas.offsetTop;
            const walkX = (x - startX) * 1;
            const walkY = (y - startY) * 1;
            updatedCanvas.scrollLeft = scrollLeft - walkX;
            updatedCanvas.scrollTop = scrollTop - walkY;
        });
        
        updatedCanvas.addEventListener('mouseup', () => {
            isPanning = false;
            updatedCanvas.style.cursor = isHandMode ? 'grab' : 'default';
        });
        
        updatedCanvas.addEventListener('mouseleave', () => {
            isPanning = false;
            updatedCanvas.style.cursor = isHandMode ? 'grab' : 'default';
        });
    }

    // Table Management
    showTableModal(tableId = null) {
        const modal = document.getElementById('tableModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('tableForm');
        
        form.reset();
        document.getElementById('columnsContainer').innerHTML = '';
        
        // Store the table being edited (null for new table)
        this.editingTableId = tableId;
        
        if (tableId) {
            title.textContent = 'Edit Tabel';
            const table = this.tables.get(tableId);
            document.getElementById('tableName').value = table.name;
            
            table.columns.forEach(column => {
                this.addColumnForm(column);
            });
        } else {
            title.textContent = 'Tambah Tabel Baru';
            // Auto-generate id column for new tables
            this.addColumnForm({
                name: 'id',
                type: 'INT',
                isPrimary: true,
                isNullable: false,
                isUnique: false,
                comment: 'Primary key auto increment'
            });
        }
        
        modal.classList.add('show');
        document.getElementById('tableName').focus();
    }

    hideTableModal() {
        document.getElementById('tableModal').classList.remove('show');
        // Reset editing state
        this.editingTableId = null;
    }

    addColumnForm(columnData = null) {
        const container = document.getElementById('columnsContainer');
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column-form';
        
        const columnId = Date.now() + Math.random();
        
        // Auto-check not null by default for new columns
        const isNotNull = columnData ? !columnData.isNullable : true;
        const isForeignKey = columnData?.isForeignKey || false;
        const isDisabled = isForeignKey ? 'disabled' : '';
        const fkInfo = isForeignKey ? `<small style="color: #6b7280; font-style: italic;">FK → ${columnData.referencedTable}.${columnData.referencedColumn}</small>` : '';
        
        columnDiv.innerHTML = `
            <div class="column-form-header">
                <div class="column-basic-info">
                    <div class="column-name-group">
                        <label>Nama Kolom:</label>
                        <input type="text" class="column-name" value="${columnData?.name || ''}" placeholder="nama_kolom" required ${isForeignKey ? 'readonly' : ''}>
                        ${fkInfo}
                    </div>
                    <div class="column-type-group">
                        <label>Tipe Data:</label>
                        <select class="column-type" ${isDisabled}>
                            <option value="VARCHAR(255)" ${columnData?.type === 'VARCHAR(255)' ? 'selected' : ''}>VARCHAR(255)</option>
                            <option value="INT" ${columnData?.type === 'INT' ? 'selected' : ''}>INT</option>
                            <option value="BIGINT" ${columnData?.type === 'BIGINT' ? 'selected' : ''}>BIGINT</option>
                            <option value="DECIMAL" ${columnData?.type === 'DECIMAL' ? 'selected' : ''}>DECIMAL</option>
                            <option value="TEXT" ${columnData?.type === 'TEXT' ? 'selected' : ''}>TEXT</option>
                            <option value="DATE" ${columnData?.type === 'DATE' ? 'selected' : ''}>DATE</option>
                            <option value="DATETIME" ${columnData?.type === 'DATETIME' ? 'selected' : ''}>DATETIME</option>
                            <option value="BOOLEAN" ${columnData?.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                        </select>
                        ${isForeignKey ? '<small style="color: #ef4444;">🔒 Tipe data dikunci (Foreign Key)</small>' : ''}
                    </div>
                    <button type="button" class="remove-column" onclick="this.parentElement.parentElement.parentElement.remove()" ${isForeignKey ? 'disabled title="Tidak dapat menghapus kolom Foreign Key"' : ''}>×</button>
                </div>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" class="column-primary" ${columnData?.isPrimary ? 'checked' : ''} ${isForeignKey ? 'disabled' : ''}>
                        <label>PK</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" class="column-nullable" ${!isNotNull ? 'checked' : ''} ${isForeignKey ? 'disabled' : ''}>
                        <label>Null</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" class="column-unique" ${columnData?.isUnique ? 'checked' : ''} ${isForeignKey ? 'disabled' : ''}>
                        <label>UQ</label>
                    </div>
                </div>
            </div>
            <div class="column-comment-group">
                <label>Catatan/Comment:</label>
                <textarea class="column-comment" placeholder="Tambahkan catatan untuk kolom ini..." rows="2">${columnData?.comment || ''}</textarea>
            </div>
        `;
        
        container.appendChild(columnDiv);
    }

    saveTable() {
        const tableName = document.getElementById('tableName').value.trim();
        if (!tableName) {
            alert('Nama tabel harus diisi!');
            return;
        }

        const columnForms = document.querySelectorAll('.column-form');
        const columns = [];
        
        for (let form of columnForms) {
            const name = form.querySelector('.column-name').value.trim();
            const type = form.querySelector('.column-type').value;
            const isPrimary = form.querySelector('.column-primary').checked;
            const isNullable = form.querySelector('.column-nullable').checked;
            const isUnique = form.querySelector('.column-unique').checked;
            const comment = form.querySelector('.column-comment').value.trim();
            
            if (!name) {
                alert('Semua kolom harus memiliki nama!');
                return;
            }
            
            columns.push({ name, type, isPrimary, isNullable, isUnique, comment });
        }
        
        if (columns.length === 0) {
            alert('Tabel harus memiliki minimal satu kolom!');
            return;
        }

        // Use editingTableId to determine if this is edit or new table
        const tableId = this.editingTableId || this.generateId();
        const isNewTable = !this.editingTableId;
        
        const table = {
            id: tableId,
            name: tableName,
            columns: columns,
            x: isNewTable ? 100 + (this.tables.size * 50) : this.tables.get(tableId).x,
            y: isNewTable ? 100 + (this.tables.size * 50) : this.tables.get(tableId).y
        };

        this.tables.set(tableId, table);
        this.renderTable(table);
        this.updateSidebar();
        this.updateProjectInfo();
        this.hideTableModal();
        
        // Don't change selectedTable when saving - keep current selection
        // Only clear editingTableId
        this.editingTableId = null;
    }

    renderTable(table) {
        // Remove existing table element if it exists
        const existingElement = document.getElementById(`table-${table.id}`);
        if (existingElement) {
            existingElement.remove();
        }

        const tableElement = document.createElement('div');
        tableElement.className = 'table-card';
        tableElement.id = `table-${table.id}`;
        tableElement.style.left = `${table.x}px`;
        tableElement.style.top = `${table.y}px`;
        
        const columnsHtml = table.columns.map(column => {
            const constraints = [];
            if (column.isPrimary) constraints.push('<span class="constraint-badge primary">PK</span>');
            if (column.isUnique) constraints.push('<span class="constraint-badge">UQ</span>');
            if (!column.isNullable) constraints.push('<span class="constraint-badge">NN</span>');
            
            // Check if this column has relations
            const hasRelation = this.relations.some(relation => 
                (relation.fromTable === table.id && relation.fromColumn === column.name) ||
                (relation.toTable === table.id && relation.toColumn === column.name)
            );
            
            const relationClass = hasRelation ? ' has-relation' : '';
            const commentHtml = column.comment ? `<div class="column-comment" title="${column.comment}">💬</div>` : '';
            
            return `
                <div class="column-row${relationClass}" data-column="${column.name}">
                    <div class="column-info">
                        <div class="column-name">${column.name}</div>
                        <div class="column-type">${column.type}</div>
                        ${column.comment ? `<div class="column-comment-text">${column.comment}</div>` : ''}
                    </div>
                    <div class="column-meta">
                        <div class="column-constraints">
                            ${constraints.join('')}
                        </div>
                        ${commentHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        tableElement.innerHTML = `
            <div class="table-header">
                <div class="table-name">${table.name}</div>
                <div class="table-actions">
                    <button class="action-btn" onclick="erdDesigner.showTableModal('${table.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn" onclick="erdDesigner.showRelationModal('${table.id}')" title="Buat Relasi">
                        🔗
                    </button>
                    <button class="action-btn" onclick="erdDesigner.deleteTable('${table.id}')" title="Hapus">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="table-columns">
                ${columnsHtml}
            </div>
        `;
        
        // Make table draggable
        this.makeDraggable(tableElement, table);
        
        // Add click handler
        tableElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTable(table.id);
        });
        
        document.getElementById('tablesContainer').appendChild(tableElement);
    }

    makeDraggable(element, table) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const header = element.querySelector('.table-header');
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('action-btn')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = table.x;
            initialY = table.y;
            
            element.classList.add('dragging');
            
            const handleMouseMove = (e) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                table.x = Math.max(0, initialX + deltaX);
                table.y = Math.max(0, initialY + deltaY);
                
                element.style.left = `${table.x}px`;
                element.style.top = `${table.y}px`;
                
                this.updateRelations();
            };
            
            const handleMouseUp = () => {
                isDragging = false;
                element.classList.remove('dragging');
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    selectTable(tableId) {
        this.deselectAll();
        this.selectedTable = tableId;
        document.getElementById(`table-${tableId}`).classList.add('selected');
    }

    deselectAll() {
        this.selectedTable = null;
        document.querySelectorAll('.table-card').forEach(el => {
            el.classList.remove('selected');
        });
    }

    deleteTable(tableId) {
        if (confirm('Apakah Anda yakin ingin menghapus tabel ini?')) {
            // Remove table
            this.tables.delete(tableId);
            document.getElementById(`table-${tableId}`)?.remove();
            
            // Remove related relations
            this.relations = this.relations.filter(relation => 
                relation.fromTable !== tableId && relation.toTable !== tableId
            );
            
            this.updateRelations();
            this.updateSidebar();
            this.updateProjectInfo();
            
            if (this.selectedTable === tableId) {
                this.selectedTable = null;
            }
        }
    }

    // Relation Management
    showRelationModal(fromTableId = null) {
        const modal = document.getElementById('relationModal');
        const fromTableSelect = document.getElementById('fromTable');
        const toTableSelect = document.getElementById('toTable');
        
        // Clear and populate table options
        fromTableSelect.innerHTML = '<option value="">Pilih tabel...</option>';
        toTableSelect.innerHTML = '<option value="">Pilih tabel...</option>';
        
        this.tables.forEach(table => {
            fromTableSelect.innerHTML += `<option value="${table.id}">${table.name}</option>`;
            toTableSelect.innerHTML += `<option value="${table.id}">${table.name}</option>`;
        });
        
        if (fromTableId) {
            fromTableSelect.value = fromTableId;
            this.updateColumnOptions('from');
        }
        
        modal.classList.add('show');
    }

    hideRelationModal() {
        document.getElementById('relationModal').classList.remove('show');
        document.getElementById('relationForm').reset();
        this.selectedRelation = null;
        // Reset modal title
        document.querySelector('#relationModal .modal-header h2').textContent = 'Buat Relasi';
    }

    updateColumnOptions(direction) {
        const tableSelect = document.getElementById(`${direction}Table`);
        const columnSelect = document.getElementById(`${direction}Column`);
        const tableId = tableSelect.value;
        
        columnSelect.innerHTML = '<option value="">Pilih kolom...</option>';
        
        if (tableId && this.tables.has(tableId)) {
            const table = this.tables.get(tableId);
            table.columns.forEach(column => {
                columnSelect.innerHTML += `<option value="${column.name}" data-type="${column.type}">${column.name} (${column.type})</option>`;
            });
        }
    }

    saveRelation() {
        const fromTable = document.getElementById('fromTable').value;
        const fromColumn = document.getElementById('fromColumn').value;
        const toTable = document.getElementById('toTable').value;
        const toColumn = document.getElementById('toColumn').value;
        const relationType = document.getElementById('relationType').value;
        
        if (!fromTable || !fromColumn || !toTable || !toColumn) {
            alert('Semua field harus diisi!');
            return;
        }
        
        if (fromTable === toTable) {
            alert('Tidak dapat membuat relasi ke tabel yang sama!');
            return;
        }
        
        // Get target column data type
        const targetTable = this.tables.get(toTable);
        const targetColumn = targetTable.columns.find(col => col.name === toColumn);
        
        if (!targetColumn) {
            alert(`Kolom '${toColumn}' tidak ditemukan di tabel '${targetTable.name}'. Silakan buat kolom tersebut terlebih dahulu.`);
            return;
        }
        
        const targetDataType = targetColumn.type;
        
        // Get source table and column
        const sourceTable = this.tables.get(fromTable);
        const sourceColumn = sourceTable.columns.find(col => col.name === fromColumn);
        
        if (!sourceColumn) {
            alert(`Kolom '${fromColumn}' tidak ditemukan di tabel '${sourceTable.name}'.`);
            return;
        }
        
        // Update source column to match target data type and mark as foreign key
        sourceColumn.type = targetDataType;
        sourceColumn.isForeignKey = true;
        sourceColumn.referencedTable = toTable;
        sourceColumn.referencedColumn = toColumn;
        
        // Re-render the source table to update column
        this.renderTable(sourceTable);
        
        if (this.selectedRelation) {
            // Edit existing relation
            const relationIndex = this.relations.findIndex(r => r.id === this.selectedRelation);
            if (relationIndex !== -1) {
                this.relations[relationIndex] = {
                    id: this.selectedRelation,
                    fromTable,
                    fromColumn,
                    toTable,
                    toColumn,
                    type: relationType
                };
            }
            this.selectedRelation = null;
        } else {
            // Create new relation
            const relation = {
                id: this.generateId(),
                fromTable,
                fromColumn,
                toTable,
                toColumn,
                type: relationType
            };
            this.relations.push(relation);
        }
        
        this.updateRelations();
        this.updateSidebar();
        this.updateProjectInfo();
        this.hideRelationModal();
    }

    updateRelations() {
        const svg = document.getElementById('relationSvg');
        
        // Clear existing relations
        const existingLines = svg.querySelectorAll('.relation-line');
        existingLines.forEach(line => line.remove());
        
        // Re-render all tables to update relation indicators
        this.tables.forEach(table => {
            this.renderTable(table);
        });
        
        // Draw all relations
        this.relations.forEach(relation => {
            this.drawRelation(relation);
        });
    }

    drawRelation(relation) {
        const fromTable = this.tables.get(relation.fromTable);
        const toTable = this.tables.get(relation.toTable);
        
        if (!fromTable || !toTable) return;
        
        const fromElement = document.getElementById(`table-${relation.fromTable}`);
        const toElement = document.getElementById(`table-${relation.toTable}`);
        
        if (!fromElement || !toElement) return;
        
        // Find specific column elements
        const fromColumnElement = fromElement.querySelector(`[data-column="${relation.fromColumn}"]`);
        const toColumnElement = toElement.querySelector(`[data-column="${relation.toColumn}"]`);
        
        if (!fromColumnElement || !toColumnElement) return;
        
        const fromColumnRect = fromColumnElement.getBoundingClientRect();
        const toColumnRect = toColumnElement.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        // Calculate connection points at column level with zoom compensation
        const baseFromX = (fromColumnRect.right - canvasRect.left) / this.zoomLevel;
        const baseFromY = (fromColumnRect.top - canvasRect.top + fromColumnRect.height / 2) / this.zoomLevel;
        const baseToX = (toColumnRect.left - canvasRect.left) / this.zoomLevel;
        const baseToY = (toColumnRect.top - canvasRect.top + toColumnRect.height / 2) / this.zoomLevel;
        
        // Apply zoom scaling to get final coordinates
        const fromX = baseFromX * this.zoomLevel;
        const fromY = baseFromY * this.zoomLevel;
        const toX = baseToX * this.zoomLevel;
        const toY = baseToY * this.zoomLevel;
        
        // Create SVG line
        const svg = document.getElementById('relationSvg');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create curved path with better curve calculation
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        const curveOffset = Math.min(deltaX * 0.3, 50); // Dynamic curve based on distance
        
        let pathData;
        if (fromX < toX) {
            // Left to right connection
            const midX1 = fromX + curveOffset;
            const midX2 = toX - curveOffset;
            pathData = `M ${fromX} ${fromY} C ${midX1} ${fromY} ${midX2} ${toY} ${toX} ${toY}`;
        } else {
            // Right to left connection (tables overlap)
            const midX = (fromX + toX) / 2;
            const midY1 = fromY - 30;
            const midY2 = toY - 30;
            pathData = `M ${fromX} ${fromY} C ${fromX + 30} ${midY1} ${toX - 30} ${midY2} ${toX} ${toY}`;
        }
        
        line.setAttribute('d', pathData);
        line.setAttribute('class', `relation-line ${relation.type}`);
        line.setAttribute('data-relation-id', relation.id);
        line.setAttribute('stroke', '#4f46e5');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('fill', 'none');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        // Add click handler for editing/deletion
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedRelation = relation.id;
            this.showRelationContextMenu(e, relation);
        });
        
        svg.appendChild(line);
    }
    
    showRelationContextMenu(event, relation) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.relation-context-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'relation-context-menu';
        menu.innerHTML = `
            <button onclick="erdDesigner.editRelation('${relation.id}')">Edit Relasi</button>
            <button onclick="erdDesigner.deleteRelation('${relation.id}')">Hapus Relasi</button>
        `;
        
        menu.style.position = 'absolute';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.style.zIndex = '1001';
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 10);
    }
    
    editRelation(relationId) {
        const relation = this.relations.find(r => r.id === relationId);
        if (!relation) return;
        
        this.selectedRelation = relationId;
        this.showRelationModal();
        
        // Populate form with existing relation data
        document.getElementById('fromTable').value = relation.fromTable;
        this.updateColumnOptions('from');
        document.getElementById('fromColumn').value = relation.fromColumn;
        
        document.getElementById('toTable').value = relation.toTable;
        this.updateColumnOptions('to');
        document.getElementById('toColumn').value = relation.toColumn;
        
        document.getElementById('relationType').value = relation.type;
        
        // Change modal title
        document.querySelector('#relationModal .modal-header h2').textContent = 'Edit Relasi';
    }
    
    editSelectedRelation() {
        if (this.selectedRelation) {
            this.editRelation(this.selectedRelation);
        }
    }

    deleteRelation(relationId) {
        this.relations = this.relations.filter(r => r.id !== relationId);
        this.updateRelations();
        this.updateSidebar();
        this.updateProjectInfo();
    }

    // Sidebar Management
    updateSidebar() {
        this.updateTableList();
        this.updateRelationList();
    }

    updateTableList() {
        const container = document.getElementById('tableList');
        
        if (this.tables.size === 0) {
            container.innerHTML = '<p class="empty-state">Belum ada tabel. Klik "Tambah Tabel" untuk memulai.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        this.tables.forEach(table => {
            const tableItem = document.createElement('div');
            tableItem.className = 'table-item';
            tableItem.innerHTML = `
                <h4>${table.name}</h4>
                <div class="column-count">${table.columns.length} kolom</div>
            `;
            
            tableItem.addEventListener('click', () => {
                this.selectTable(table.id);
                // Scroll to table
                const tableElement = document.getElementById(`table-${table.id}`);
                if (tableElement) {
                    tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            
            container.appendChild(tableItem);
        });
    }

    updateRelationList() {
        const container = document.getElementById('relationList');
        
        if (this.relations.length === 0) {
            container.innerHTML = '<p class="empty-state">Belum ada relasi.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        this.relations.forEach(relation => {
            const fromTable = this.tables.get(relation.fromTable);
            const toTable = this.tables.get(relation.toTable);
            
            if (!fromTable || !toTable) return;
            
            const relationItem = document.createElement('div');
            relationItem.className = 'relation-item';
            relationItem.innerHTML = `
                <div><strong>${fromTable.name}.${relation.fromColumn}</strong></div>
                <div style="text-align: center; color: #6b7280; margin: 0.2rem 0;">↓ ${relation.type}</div>
                <div><strong>${toTable.name}.${relation.toColumn}</strong></div>
            `;
            
            relationItem.addEventListener('click', () => {
                if (confirm('Hapus relasi ini?')) {
                    this.deleteRelation(relation.id);
                }
            });
            
            container.appendChild(relationItem);
        });
    }

    // Export Functionality
    exportERD() {
        if (this.tables.size === 0) {
            alert('Tidak ada tabel untuk diekspor!');
            return;
        }
        
        let output = 'ERD DESIGN EXPORT\n';
        output += '==================\n\n';
        
        // Export tables
        output += 'TABLES:\n';
        output += '-------\n';
        
        this.tables.forEach(table => {
            output += `\nTable: ${table.name}\n`;
            output += 'Columns:\n';
            
            table.columns.forEach(column => {
                let constraints = [];
                if (column.isPrimary) constraints.push('PRIMARY KEY');
                if (column.isUnique) constraints.push('UNIQUE');
                if (!column.isNullable) constraints.push('NOT NULL');
                
                const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
                const commentStr = column.comment ? ` -- ${column.comment}` : '';
                output += `  - ${column.name}: ${column.type}${constraintStr}${commentStr}\n`;
            });
        });
        
        // Export relations
        if (this.relations.length > 0) {
            output += '\n\nRELATIONS:\n';
            output += '----------\n';
            
            this.relations.forEach(relation => {
                const fromTable = this.tables.get(relation.fromTable);
                const toTable = this.tables.get(relation.toTable);
                
                output += `\n${fromTable.name}.${relation.fromColumn} --[${relation.type}]--> ${toTable.name}.${relation.toColumn}\n`;
            });
        }
        
        output += '\n\n--- End of ERD Export ---';
        
        // Download file
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'erd-design.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('ERD berhasil diekspor!');
    }

    // Project Management
    newProject() {
        if (this.tables.size > 0 || this.relations.length > 0) {
            if (!confirm('Membuat project baru akan menghapus semua data saat ini. Lanjutkan?')) {
                return;
            }
        }
        
        const projectName = prompt('Nama project baru:', 'My ERD Project');
        if (!projectName) return;
        
        this.clearAll(false);
        this.currentProject = {
            name: projectName,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        this.updateProjectInfo();
    }
    
    saveProject() {
        const projectData = {
            project: this.currentProject,
            tables: Array.from(this.tables.entries()),
            relations: this.relations
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.erd`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Project berhasil disimpan!');
    }
    
    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.erd';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    
                    if (!projectData.project || !projectData.tables || !projectData.relations) {
                        alert('File project tidak valid!');
                        return;
                    }
                    
                    // Clear current data
                    this.clearAll(false);
                    
                    // Load project data
                    this.currentProject = projectData.project;
                    
                    // Load tables
                    projectData.tables.forEach(([id, table]) => {
                        this.tables.set(id, table);
                        this.renderTable(table);
                    });
                    
                    // Load relations
                    this.relations = projectData.relations;
                    this.updateRelations();
                    this.updateSidebar();
                    this.updateProjectInfo();
                    
                    alert('Project berhasil dimuat!');
                } catch (error) {
                    alert('Error loading project: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    updateProjectInfo() {
        this.currentProject.modified = new Date().toISOString();
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement) {
            projectNameElement.textContent = this.currentProject.name;
        }
        
        // Update document title
        document.title = `${this.currentProject.name} - ERD Designer`;
    }

    // Utility Functions
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    clearAll(confirm = true) {
        if (confirm && !window.confirm('Hapus semua tabel dan relasi? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }
        
        this.tables.clear();
        this.relations = [];
        this.selectedTable = null;
        this.selectedRelation = null;
        
        document.getElementById('tablesContainer').innerHTML = '';
        document.getElementById('relationSvg').innerHTML = '';
        
        // Remove any existing context menus
        const existingMenu = document.querySelector('.relation-context-menu');
        if (existingMenu) existingMenu.remove();
        
        // Only re-setup canvas if it's a fresh start, not during initialization
        if (confirm) {
            // Re-add arrow marker only
            const svg = document.getElementById('relationSvg');
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '8');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '7');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 8 3, 0 6');
            polygon.setAttribute('fill', '#4f46e5');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
        }
        
        this.updateSidebar();
        
        if (!confirm) {
            this.currentProject = {
                name: 'Untitled Project',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
            this.updateProjectInfo();
        }
    }

    // Zoom functionality methods
    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel += this.zoomStep;
            this.applyZoom();
        }
    }
    
    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel -= this.zoomStep;
            this.applyZoom();
        }
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
    }
    
    applyZoom() {
        const canvas = document.getElementById('canvas');
        const tablesContainer = document.getElementById('tablesContainer');
        const relationSvg = document.getElementById('relationSvg');
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        
        // Apply transform to tables container only
        const transform = `scale(${this.zoomLevel})`;
        tablesContainer.style.transform = transform;
        tablesContainer.style.transformOrigin = '0 0';
        
        // Reset SVG transform since we handle zoom in coordinates calculation
        relationSvg.style.transform = 'none';
        relationSvg.style.transformOrigin = '0 0';
        
        // Update zoom level display
        zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        
        // Update button states
        document.getElementById('zoomInBtn').disabled = this.zoomLevel >= this.maxZoom;
        document.getElementById('zoomOutBtn').disabled = this.zoomLevel <= this.minZoom;
        
        // Update relations after zoom
        this.updateRelations();
    }
}

// Initialize the application
const erdDesigner = new ERDDesigner();

// Handle window resize to update relations
window.addEventListener('resize', () => {
    setTimeout(() => {
        erdDesigner.updateRelations();
    }, 100);
});

// Auto-save to localStorage (backup only)
let autoSaveInterval;
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(() => {
        const data = {
            project: erdDesigner.currentProject,
            tables: Array.from(erdDesigner.tables.entries()),
            relations: erdDesigner.relations,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('erd-designer-backup', JSON.stringify(data));
    }, 60000); // Save every 60 seconds
}

// Load backup on startup if available
window.addEventListener('load', () => {
    // Initialize project info
    erdDesigner.updateProjectInfo();
    
    // Check for backup
    const backupData = localStorage.getItem('erd-designer-backup');
    if (backupData) {
        try {
            const data = JSON.parse(backupData);
            const backupDate = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - backupDate) / (1000 * 60 * 60);
            
            if (hoursDiff < 24 && (data.tables.length > 0 || data.relations.length > 0)) {
                if (confirm(`Ditemukan backup dari ${backupDate.toLocaleString()}. Restore backup?`)) {
                    // Restore backup
                    if (data.project) erdDesigner.currentProject = data.project;
                    
                    data.tables.forEach(([id, table]) => {
                        erdDesigner.tables.set(id, table);
                        erdDesigner.renderTable(table);
                    });
                    
                    erdDesigner.relations = data.relations;
                    erdDesigner.updateRelations();
                    erdDesigner.updateSidebar();
                    erdDesigner.updateProjectInfo();
                }
            }
        } catch (e) {
            console.log('Could not load backup data:', e);
        }
    }
    
    // Start auto-save
    startAutoSave();
});