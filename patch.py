from pathlib import Path

for fn in ['js/app.js','docs/js/app.js']:
    p=Path('/mnt/data/dswork')/fn
    s=p.read_text()
    # nav add testing after validation
    s=s.replace('["validation","✓","Validation"]\n', '["validation","✓","Validation"],\n    ["testing","🧪","Testing"]\n')
    # In case exact string is not present due formatting
    s=s.replace('["traceability","↗","Traceability"],\n    ["validation","✓","Validation"]\n', '["traceability","↗","Traceability"],\n    ["validation","✓","Validation"],\n    ["testing","🧪","Testing"]\n')
    # quick nav item
    s=s.replace('["validation","✓","Validation","Quality gates"],\n    ["documentation"', '["validation","✓","Validation","Quality gates"],\n    ["testing","🧪","Testing","Test cases & steps"],\n    ["documentation"')
    # titles/handlers occurrences
    s=s.replace('validation:"Validation",documentation:"Documentation"', 'validation:"Validation",testing:"Testing",documentation:"Documentation"')
    s=s.replace('traceability:renderTraceability,\n    validation:renderValidation,documentation:renderDocumentation', 'traceability:renderTraceability,\n    validation:renderValidation,testing:renderTesting,documentation:renderDocumentation')
    # Second render handler map may be formatted differently
    s=s.replace('tasks:renderTasks,traceability:renderTraceability,\n    validation:renderValidation,documentation:renderDocumentation', 'tasks:renderTasks,traceability:renderTraceability,\n    validation:renderValidation,testing:renderTesting,documentation:renderDocumentation')
    # setView allowed list and reset tab in later function
    old='''  state.view=view; state.moduleId=moduleId;\n  if(view!==\'screens\'){state.screenId=null;state.selectedComponentId=null;}\n  if(view!==\'timeline\')state.timelineFilter=null;\n  render();'''
    new='''  state.view=view; state.moduleId=moduleId;\n  if(view!==\'screens\'){state.screenId=null;state.selectedComponentId=null;}\n  if(view!==\'timeline\')state.timelineFilter=null;\n  if(view!==\'module-workspace\')state.tab=\'requirements\';\n  render();'''
    s=s.replace(old,new)
    # bindActions data-module: honor stage
    old='''  $$(["data-module"]).forEach(el=>el.onclick=()=>setView(el.dataset.target||state.view,el.dataset.module));'''
    new='''  $$(["data-module"]).forEach(el=>el.onclick=()=>{\n    const target=el.dataset.target||state.view;\n    if(target==='module-workspace' && el.dataset.stage){ state.tab=el.dataset.stage; state.view='module-workspace'; state.moduleId=el.dataset.module||state.moduleId; render(); return; }\n    setView(target,el.dataset.module);\n  });'''
    s=s.replace(old,new)
    # counts include tests
    s=s.replace('return {requirements:f(project.requirements),screens:f(project.screens),entities:f(project.entities),apis:f(project.apis),logic:f(project.logic)};', 'return {requirements:f(project.requirements),screens:f(project.screens),entities:f(project.entities),apis:f(project.apis),logic:f(project.logic),tests:f(project.tests||[])};')
    # moduleProgress 4 -> 5
    s=s.replace("const values=[c.requirements>0,c.screens>0,(c.apis+c.logic)>0,c.entities>0];\n  return Math.round(values.filter(Boolean).length/4*100);", "const values=[c.requirements>0,c.screens>0,(c.apis+c.logic)>0,c.entities>0,c.tests>0];\n  return Math.round(values.filter(Boolean).length/5*100);")
    # moduleStageStatus append testing and description
    old="""    {key:'erd',label:'ERD',count:c.entities,icon:'4',desc:'Tables, fields, keys and relationships.'}\n  ];"""
    new="""    {key:'erd',label:'ERD',count:c.entities,icon:'4',desc:'Tables, fields, keys and relationships.'},\n    {key:'testing',label:'Testing',count:c.tests,icon:'5',desc:'Test cases, execution steps, expected results and review comments.'}\n  ];"""
    s=s.replace(old,new)
    # modules page labels
    s=s.replace('Modules → Requirements → Screens → Backend → ERD', 'Modules → Requirements → Screens → Backend → ERD → Testing')
    s=s.replace('FOUR-STAGE DESIGN MODEL', 'FIVE-STAGE DESIGN MODEL')
    s=s.replace('Click any stage to open its module workspace.', 'Click any stage to open its module workspace.')
    # workspace tabs
    s=s.replace("const tabs=[['requirements','1','Gather Requirements',c.requirements],['screens','2','Suggested Screens',c.screens],['backend','3','Backend Logic',c.apis+c.logic],['erd','4','ERD',c.entities]];", "const tabs=[['requirements','1','Gather Requirements',c.requirements],['screens','2','Suggested Screens',c.screens],['backend','3','Backend Logic',c.apis+c.logic],['erd','4','ERD',c.entities],['testing','5','Testing',c.tests]];")
    # progress text
    s=s.replace('4-stage completion', '5-stage completion')
    # add testing body before content assignment
    marker="  if(tab==='erd') body=`<div class=\"workspace-stage-head\"><div><span class=\"eyebrow\">STAGE 4</span><h2>ERD</h2>"
    # insert after the entire erd line by locating exact ending
    erd_end="  if(tab==='erd') body=`<div class=\"workspace-stage-head\"><div><span class=\"eyebrow\">STAGE 4</span><h2>ERD</h2><p>Define the Oracle tables, fields and relationships required by this module.</p></div><div><button class=\"btn secondary\" data-view=\"erd\" data-module=\"${m.id}\">Open Module ERD</button><button class=\"btn primary\" data-action=\"new-entity\">＋ Table</button></div></div><div class=\"erd-mini-summary\"><div><b>${ents.length}</b><span>Tables</span></div><div><b>${ents.reduce((n,e)=>(n+(e.fields||[]).length),0)}</b><span>Fields</span></div><div><b>${project.relations.filter(r=>ents.some(e=>e.id===r.from)&&ents.some(e=>e.id===r.to)).length}</b><span>Relationships</span></div></div><div class=\"artifact-list\">${ents.map(e=>`<div class=\"artifact-row\"><div class=\"artifact-id\">◇</div><div><strong>${esc(e.name)}</strong><small>${(e.fields||[]).length} fields · ${esc(moduleById(e.moduleId)?.name||'')}</small></div><button class=\"btn tiny\" data-action=\"edit-entity\" data-id=\"${e.id}\">Open</button></div>`).join('')||'<div class=\"empty\">No tables defined for this module.</div>'}</div>`;"
    # Easier: find line starting with if(tab==='erd') and inject after line
    lines=s.splitlines()
    out=[]
    injected=False
    for line in lines:
        out.append(line)
        if line.startswith("  if(tab==='erd') body=`") and not injected:
            out.append("  if(tab==='testing') { const tests=(project.tests||[]).filter(t=>t.moduleId===m.id); body=`<div class=\"workspace-stage-head\"><div><span class=\"eyebrow\">STAGE 5</span><h2>Testing</h2><p>Execute functional, integration, UI and acceptance tests for this module. Every test can contain detailed steps with individual status and comments.</p></div><div><button class=\"btn secondary\" data-view=\"testing\" data-module=\"${m.id}\">Open Testing Center</button><button class=\"btn primary\" data-action=\"new-test\">＋ Test Case</button></div></div><div class=\"testing-mini-summary\"><div><b>${tests.length}</b><span>Test cases</span></div><div><b>${tests.filter(t=>t.status==='Passed').length}</b><span>Passed</span></div><div><b>${tests.filter(t=>t.status==='Failed').length}</b><span>Failed</span></div><div><b>${tests.filter(t=>t.status==='Blocked').length}</b><span>Blocked</span></div></div><div class=\"artifact-list\">${tests.map(t=>`<div class=\"artifact-row\"><div class=\"artifact-id\">🧪</div><div><strong>${esc(t.name)}</strong><small>${esc(t.type||'Functional')} · ${esc(t.status||'Not Run')} · ${(t.steps||[]).length} steps</small></div><button class=\"btn tiny\" data-action=\"edit-test\" data-id=\"${t.id}\">Open</button></div>`).join('')||'<div class=\"empty\">No test cases defined for this module yet.</div>'}</div>`; }"
            injected=True
    s='\n'.join(out)+'\n'
    # ERD fix: add missing command controls to markup
    old='''<button class="erd-connect-command ${relationMode?'active':''}" id="erdConnectCommand">${relationMode?'✕ Cancel Connection':'⌁ Connect Tables'}</button>\n      <span class="erd-help">'''
    new='''<button class="erd-connect-command ${relationMode?'active':''}" id="erdConnectCommand">${relationMode?'✕ Cancel Connection':'⌁ Connect Tables'}</button>\n      <button class="erd-view-command ${state.erdCompact?'active':''}" id="erdCompactCommand">▦ Compact</button><button class="erd-view-command" id="erdArrangeCommand">✦ Auto Arrange</button><button class="erd-view-command" id="erdZoomOut">−</button><span class="erd-zoom-label" id="erdZoomLabel">${state.erdZoom}%</span><button class="erd-view-command" id="erdZoomIn">+</button>\n      <span class="erd-help">'''
    s=s.replace(old,new)
    # ERD source click render should preserve module; use render not issue. Make connect button set state then renderERD to avoid handler mismatch.
    s=s.replace("state.erdConnectFrom=connectBtn.dataset.erdConnect;render();showToast('Source selected. Click the target table.');return;", "state.erdConnectFrom=connectBtn.dataset.erdConnect;renderERD();showToast('Source selected. Click the target table.');return;")
    s=s.replace("if(createERDRelation(state.erdConnectFrom,table.dataset.entity))render();", "if(createERDRelation(state.erdConnectFrom,table.dataset.entity))renderERD();")
    # project ERD same render calls
    s=s.replace("state.erdConnectFrom=connectBtn.dataset.erdConnect;render();showToast('Source selected. Click the target table.');return;", "state.erdConnectFrom=connectBtn.dataset.erdConnect;render();showToast('Source selected. Click the target table.');return;")
    # Add testing handler map if not done
    # nav allowed list
    s=s.replace("['backend','erd','project-erd','screens','requirements','modules','timeline','architecture','technical','traceability','validation','documentation','references','dashboard']", "['backend','erd','project-erd','screens','requirements','modules','timeline','architecture','technical','traceability','validation','testing','documentation','references','dashboard']")
    # Add testing form/functions before renderValidation
    insert_at=s.find('function renderValidation(){')
    if insert_at!=-1 and 'function renderTesting(){' not in s:
        block=r'''function renderTesting(){
  const all=(project.tests||[]).filter(t=>!state.moduleId || t.moduleId===state.moduleId);
  const total=all.length, passed=all.filter(t=>t.status==='Passed').length, failed=all.filter(t=>t.status==='Failed').length, blocked=all.filter(t=>t.status==='Blocked').length, notRun=all.filter(t=>!t.status||t.status==='Not Run').length;
  const modules=project.modules;
  const rows=all.map(t=>`<div class="testing-case-card"><div class="testing-case-head"><div><span class="eyebrow">${esc(t.type||'Functional')} · ${esc(t.priority||'Medium')}</span><h3>${esc(t.name)}</h3><small>${esc(t.id)} · ${esc(moduleById(t.moduleId)?.name||'Project')} · ${(t.steps||[]).length} steps</small></div><div class="testing-case-actions"><span class="test-status ${String(t.status||'Not Run').toLowerCase().replace(/\s+/g,'-')}">${esc(t.status||'Not Run')}</span><button class="btn tiny" data-action="edit-test" data-id="${t.id}">Open</button><button class="icon-btn danger" data-action="delete-test" data-id="${t.id}">×</button></div></div><div class="testing-case-meta"><div><b>Requirement</b><span>${esc(t.requirementId||'—')}</span></div><div><b>Screen</b><span>${esc(project.screens.find(s=>s.id===t.screenId)?.name||t.screenId||'—')}</span></div><div><b>Expected result</b><span>${esc(t.expectedResult||'—')}</span></div></div><div class="testing-steps-mini">${(t.steps||[]).map((st,i)=>`<div class="testing-step-mini"><span>${i+1}</span><div><strong>${esc(st.action||'Step')}</strong><small>Expected: ${esc(st.expected||'—')}</small></div><em class="step-${String(st.status||'Not Run').toLowerCase().replace(/\s+/g,'-')}">${esc(st.status||'Not Run')}</em>${st.comments?`<p>💬 ${esc(st.comments)}</p>`:''}</div>`).join('')||'<div class="muted small-text">No execution steps defined.</div>'}</div>${t.comments?`<div class="testing-case-comment">💬 ${esc(t.comments)}</div>`:''}</div>`).join('');
  $('#content').innerHTML=`<div class="testing-hero"><div><span class="eyebrow">QUALITY & UAT</span><h1>Testing Center</h1><p>Define, execute and review test cases across requirements, screens, backend logic and ERD. Each test step has its own status and comment so defects and decisions stay attached to the evidence.</p></div><div><button class="btn primary" data-action="new-test">＋ New Test Case</button></div></div><div class="testing-filter-bar"><select id="testingModuleFilter"><option value="ALL">All modules</option>${modules.map(m=>`<option value="${m.id}" ${state.moduleId===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select><select id="testingStatusFilter"><option value="ALL">All statuses</option>${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option>${x}</option>`).join('')}</select><select id="testingTypeFilter"><option value="ALL">All types</option>${['Functional','UI','Integration','API','Security','UAT','Regression','Performance'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="grid cards testing-summary">${metric('Test Cases',total,'🧪')}${metric('Passed',passed,'✓')}${metric('Failed',failed,'⚠')}${metric('Blocked',blocked,'⛔')}${metric('Not Run',notRun,'○')}</div><div id="testingCases" class="testing-case-list">${rows||'<div class="empty"><strong>No test cases yet</strong><p>Create a test case and add detailed execution steps with comments.</p><button class="btn primary" data-action="new-test">＋ Create first test</button></div>'}</div>`;
  const apply=()=>{const mod=$('#testingModuleFilter')?.value||'ALL',st=$('#testingStatusFilter')?.value||'ALL',ty=$('#testingTypeFilter')?.value||'ALL'; $$('.testing-case-card').forEach(card=>{const ok=(!mod||mod==='ALL'||card.dataset.module===mod)&&(!st||st==='ALL'||card.dataset.status===st)&&(!ty||ty==='ALL'||card.dataset.type===ty);card.style.display=ok?'':'none';});};
  $$('.testing-case-card').forEach((card,i)=>{const t=all[i];card.dataset.module=t.moduleId||'';card.dataset.status=t.status||'Not Run';card.dataset.type=t.type||'Functional';});
  ['testingModuleFilter','testingStatusFilter','testingTypeFilter'].forEach(id=>$('#'+id)?.addEventListener('change',apply)); apply();
}
function testingForm(item){
  item ||= {id:uid('TEST'),moduleId:state.moduleId||project.modules[0]?.id||'',requirementId:'',screenId:'',name:'',type:'Functional',priority:'Medium',status:'Not Run',preconditions:'',expectedResult:'',actualResult:'',comments:'',steps:[{id:uid('STEP'),action:'Open the target screen',expected:'The screen opens without errors',status:'Not Run',comments:''}]};
  const stepRows=(item.steps||[]).map((st,i)=>`<div class="test-step-editor" data-step-row><div class="test-step-number">${i+1}</div><div class="test-step-fields"><input name="step_action" data-step-index="${i}" value="${esc(st.action||'')}" placeholder="Action / instruction"><input name="step_expected" data-step-index="${i}" value="${esc(st.expected||'')}" placeholder="Expected result"><select name="step_status" data-step-index="${i}">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option ${x===(st.status||'Not Run')?'selected':''}>${x}</option>`).join('')}</select><textarea name="step_comments" data-step-index="${i}" placeholder="Comment for this step, defect, evidence or decision...">${esc(st.comments||'')}</textarea></div><button type="button" class="icon-btn danger" data-action="remove-test-step" data-index="${i}">×</button></div>`).join('');
  const reqOpts=project.requirements.map(r=>`<option value="${r.id}" ${r.id===(item.requirementId||'')?'selected':''}>${esc(r.id)} — ${esc(r.title)}</option>`).join('');
  const screenOpts=project.screens.filter(s=>!item.moduleId||s.moduleId===item.moduleId).map(s=>`<option value="${s.id}" ${s.id===(item.screenId||'')?'selected':''}>${esc(s.name)}</option>`).join('');
  return `<div class="form-grid"><div class="field"><label>Test ID</label><input name="id" value="${esc(item.id)}" readonly></div><div class="field"><label>Module</label>${moduleSelector(item.moduleId)}</div><div class="field full"><label>Test name</label><input name="name" value="${esc(item.name)}" placeholder="Example: Create employee with valid data"></div><div class="field"><label>Type</label><select name="type">${['Functional','UI','Integration','API','Security','UAT','Regression','Performance'].map(x=>`<option ${x===item.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Priority</label><select name="priority">${['Low','Medium','High','Critical'].map(x=>`<option ${x===item.priority?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Status</label><select name="status">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option ${x===item.status?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Requirement</label><select name="requirementId"><option value="">— None —</option>${reqOpts}</select></div><div class="field"><label>Screen</label><select name="screenId"><option value="">— None —</option>${screenOpts}</select></div><div class="field full"><label>Preconditions</label><textarea name="preconditions" placeholder="Required setup, user role, data or environment...">${esc(item.preconditions||'')}</textarea></div><div class="field full"><label>Expected overall result</label><textarea name="expectedResult">${esc(item.expectedResult||'')}</textarea></div><div class="field full"><label>Actual result / execution notes</label><textarea name="actualResult">${esc(item.actualResult||'')}</textarea></div><div class="field full"><div class="card-title"><h3>Execution Steps</h3><button type="button" class="btn secondary" data-action="add-test-step">＋ Step</button></div><div id="testStepsEditor">${stepRows||'<div class="empty">No steps. Add one.</div>'}</div></div><div class="field full"><label>💬 Test Case Comments</label><textarea name="comments" placeholder="Defects, reviewer notes, environment, evidence links or decisions...">${esc(item.comments||'')}</textarea></div></div>`;
}
function addTestingStep(){const box=$('#testStepsEditor');if(!box)return;const i=box.querySelectorAll('[data-step-row]').length;box.insertAdjacentHTML('beforeend',`<div class="test-step-editor" data-step-row><div class="test-step-number">${i+1}</div><div class="test-step-fields"><input name="step_action" data-step-index="${i}" value="" placeholder="Action / instruction"><input name="step_expected" data-step-index="${i}" value="" placeholder="Expected result"><select name="step_status" data-step-index="${i}">${['Not Run','In Progress','Passed','Failed','Blocked','Skipped'].map(x=>`<option>${x}</option>`).join('')}</select><textarea name="step_comments" data-step-index="${i}" placeholder="Comment for this step, defect, evidence or decision..."></textarea></div><button type="button" class="icon-btn danger" data-action="remove-test-step" data-index="${i}">×</button></div>`); $$('#modalRoot [data-action="remove-test-step"]').forEach(el=>el.onclick=()=>removeTestingStep(el.dataset.index));}
function removeTestingStep(index){const rows=$$('#testStepsEditor [data-step-row]');if(rows[index])rows[index].remove();rows.forEach((r,i)=>{r.querySelector('.test-step-number').textContent=i+1;r.querySelectorAll('[data-step-index]').forEach(x=>x.dataset.stepIndex=i);r.querySelector('[data-action="remove-test-step"]')?.setAttribute('data-index',i);});}
function submitTestingModal(){const v=formValues();const steps=$$('#testStepsEditor [data-step-row]').map((row,i)=>({id:row.dataset.id||uid('STEP'),action:row.querySelector('[name="step_action"]')?.value.trim()||'',expected:row.querySelector('[name="step_expected"]')?.value.trim()||'',status:row.querySelector('[name="step_status"]')?.value||'Not Run',comments:row.querySelector('[name="step_comments"]')?.value||''})).filter(x=>x.action||x.expected||x.comments);if(!v.name.trim())return alert('Test case name is required');const obj={id:v.id,moduleId:v.moduleId,requirementId:v.requirementId,screenId:v.screenId,name:v.name.trim(),type:v.type,priority:v.priority,status:v.status,preconditions:v.preconditions,expectedResult:v.expectedResult,actualResult:v.actualResult,comments:v.comments,steps};const old=project.tests.find(x=>x.id===state.editing.id);if(old)Object.assign(old,obj);else project.tests.push(obj);saveProject(false);closeModal();render();showToast(old?'Test case updated':'Test case created');}
'''
        s=s[:insert_at]+block+s[insert_at:]
    # handleAction testing cases
    marker='    case "new-entity": state.editing={type:"entity"};'
    if marker in s and 'case "new-test":' not in s:
        s=s.replace(marker, '    case "new-test": state.editing={type:"test"}; modal("New Test Case",testingForm(),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-testing-modal">Save Test Case</button>`,true); break;\n    case "edit-test": state.editing={type:"test",id}; modal("Edit Test Case",testingForm(project.tests.find(x=>x.id===id)),`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn primary" data-action="submit-testing-modal">Save Test Case</button>`,true); break;\n    case "delete-test": if(confirm("Delete this test case?")){project.tests=project.tests.filter(x=>x.id!==id);saveProject(false);render();showToast("Test case deleted")} break;\n    case "add-test-step": addTestingStep(); break;\n    case "remove-test-step": removeTestingStep(id || el?.dataset?.index); break;\n'+marker)
    # The remove action handler cannot access el. Replace exact case with robust dataset via handleAction signature modification.
    s=s.replace('function handleAction(action,id){', 'function handleAction(action,id){')
    s=s.replace('case "remove-test-step": removeTestingStep(id || el?.dataset?.index); break;', 'case "remove-test-step": removeTestingStep(id); break;')
    # submit modal dispatch
    s=s.replace('  if(t==="project-comment"){', '  if(t==="test")return submitTestingModal();\n  if(t==="project-comment"){')
    # Add tests normalize in store only later separately
    p.write_text(s)

# store changes
for fn in ['js/store.js','docs/js/store.js']:
    p=Path('/mnt/data/dswork')/fn
    s=p.read_text()
    # add tests default after logic block in DEFAULT_PROJECT
    if '  tests: [' not in s:
        needle='''  logic: [\n    {id:"LOGIC-PER-001",moduleId:"PERSONNEL",name:"Create Employee Workflow",trigger:"POST /api/personnel/employees",steps:["Authenticate user","Check EMPLOYEE.CREATE permission","Validate request","Check employee number uniqueness","Check department and position","Insert EMPLOYEE","Write audit log","Return 201 Created"]}\n  ],'''
        repl='''  logic: [\n    {id:"LOGIC-PER-001",moduleId:"PERSONNEL",name:"Create Employee Workflow",trigger:"POST /api/personnel/employees",steps:["Authenticate user","Check EMPLOYEE.CREATE permission","Validate request","Check employee number uniqueness","Check department and position","Insert EMPLOYEE","Write audit log","Return 201 Created"]}\n  ],\n  tests: [],'''
        s=s.replace(needle,repl)
    # normalize project add tests
    if 'project.tests ||= [];' not in s:
        # find normalizeProject function
        idx=s.find('function normalizeProject()')
        if idx!=-1:
            brace=s.find('{',idx)
            s=s[:brace+1]+'\n  project.tests ||= [];\n  project.tests.forEach(t=>{t.steps ||= []; t.comments ||= ""; t.status ||= "Not Run"; t.type ||= "Functional"; t.priority ||= "Medium";});'+s[brace+1:]
    p.write_text(s)
