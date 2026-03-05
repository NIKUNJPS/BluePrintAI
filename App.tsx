import React, { useState, useRef, useEffect, useCallback } from 'react';
import { runDeepIntakeAnalysis, runQuickScan, ChatService } from './services/geminiService';
import { STEEL_INTAKE_SYSTEM_PROMPT, SAMPLE_PROJECT_DATA } from './constants';
import MarkdownDisplay from './components/MarkdownDisplay';
import { ThinkingIndicator, Spinner } from './components/Spinner';
import { AppMode, ChatMessage, Attachment } from './types';

// Icons (unchanged, but can be slightly tweaked with new classes if needed)
const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a5.25 5.25 0 00-3.94-3.94l-1.06-.3a.75.75 0 000 1.44l1.06.3a5.25 5.25 0 003.94 3.94l1.06.3a.75.75 0 000-1.44l-1.06-.3z" clipRule="evenodd" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 01-1.304-.96 2.388 2.388 0 00.526-1.031.75.75 0 00-.363-.757A6.738 6.738 0 011.5 12c0-5.86 5.373-10.5 12-10.5s12 4.64 12 10.5-5.373 10.5-12 10.5a9.69 9.69 0 01-4.62-1.166.75.75 0 00-.737.158 9.027 9.027 0 01-2.909 1.666.75.75 0 00.37 1.486z" clipRule="evenodd" />
  </svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283.215-.604.401-.959.401-.31 0-.557-.262-.534-.571a48.774 48.774 0 01-.595 4.845.75.75 0 01.61-.61c-1.838.334-3.718.563-5.632.676.332.02.61.246.61.578z" />
    </svg>
);

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
  </svg>
);

const CloudArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V16.5a.75.75 0 011.5 0v2.25a3.75 3.75 0 01-3.75 3.75H6A3.75 3.75 0 012.25 18.75V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

interface TableData {
  headers: string[];
  rows: string[][];
}

function App() {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.DEEP_INTAKE);
  
  // Intake State
  const [intakeInput, setIntakeInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [intakeResult, setIntakeResult] = useState<string | null>(null);
  const [isIntakeLoading, setIsIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<string>('MASTER');

  // Parsed tables state
  const [missingTable, setMissingTable] = useState<TableData | null>(null);
  const [mtoTable, setMtoTable] = useState<TableData | null>(null);
  const [summaryMaterialTable, setSummaryMaterialTable] = useState<TableData | null>(null);
  const [mtoExportNotes, setMtoExportNotes] = useState<string | null>(null);
  const [mtoExtractionLog, setMtoExtractionLog] = useState<string | null>(null);
  const [mtoRfiSuggestions, setMtoRfiSuggestions] = useState<string | null>(null);
  
  // Phase-1 / Legacy Tables
  const [drawingIndexTable, setDrawingIndexTable] = useState<TableData | null>(null);
  const [gradeTable, setGradeTable] = useState<TableData | null>(null);
  const [anchorTable, setAnchorTable] = useState<TableData | null>(null);
  const [scopeTable, setScopeTable] = useState<TableData | null>(null);

  // V3 Tables
  const [connectionTable, setConnectionTable] = useState<TableData | null>(null);
  const [specConflictTable, setSpecConflictTable] = useState<TableData | null>(null);
  
  // Tekla V3 Sub-tables
  const [teklaPrefixTable, setTeklaPrefixTable] = useState<TableData | null>(null);
  const [teklaMaterialTable, setTeklaMaterialTable] = useState<TableData | null>(null);
  const [teklaProfileTable, setTeklaProfileTable] = useState<TableData | null>(null);
  const [teklaBoltTable, setTeklaBoltTable] = useState<TableData | null>(null);

  // Issue Detector V2 Tables
  const [issueMissingDimsTable, setIssueMissingDimsTable] = useState<TableData | null>(null);
  const [issueConflictingTable, setIssueConflictingTable] = useState<TableData | null>(null);
  const [issueConnectionTable, setIssueConnectionTable] = useState<TableData | null>(null);

  // Phase-3 Tables
  const [fabRuleTable, setFabRuleTable] = useState<TableData | null>(null);
  
  // Estimation Tables (Estimation was removed, but Estimation Pro remains)
  const [estProItemizedTable, setEstProItemizedTable] = useState<TableData | null>(null);
  const [estProTaskTable, setEstProTaskTable] = useState<TableData | null>(null);

  // Landscape Specialist Mode Tables
  const [landscapeScopeTable, setLandscapeScopeTable] = useState<TableData | null>(null);
  const [landscapeRespTable, setLandscapeRespTable] = useState<TableData | null>(null);
  const [landscapeCountTable, setLandscapeCountTable] = useState<TableData | null>(null);

  // Bid Strategy Mode Tables
  const [bidDriversTable, setBidDriversTable] = useState<TableData | null>(null);

  // Risk Tracker Mode Tables
  const [riskTrackerRegisterTable, setRiskTrackerRegisterTable] = useState<TableData | null>(null);

  // Drawing Submission Schedule Mode Tables
  const [drawSchedTable, setDrawSchedTable] = useState<TableData | null>(null);

  // Internal Schedule Planner Mode Tables
  const [internalStaffingTable, setInternalStaffingTable] = useState<TableData | null>(null);
  const [internalTaskTable, setInternalTaskTable] = useState<TableData | null>(null);
  const [internalScheduleTable, setInternalScheduleTable] = useState<TableData | null>(null);


  // V3/Phase-3 Text Sections
  const [loadPathText, setLoadPathText] = useState<string | null>(null);
  const [conceptualModelText, setConceptualModelText] = useState<string | null>(null);
  const [advancedInterpretationText, setAdvancedInterpretationText] = useState<string | null>(null);
  const [teklaStartPackText, setTeklaStartPackText] = useState<string | null>(null);
  const [costWeightText, setCostWeightText] = useState<string | null>(null);
  const [clashCheckText, setClashCheckText] = useState<string | null>(null);

  // Estimation Pro Mode Text Sections
  const [estProSummaryText, setEstProSummaryText] = useState<string | null>(null);
  const [estProTotalHoursText, setEstProTotalHoursText] = useState<string | null>(null);
  const [estProRiskBufferText, setEstProRiskBufferText] = useState<string | null>(null);
  const [estProCostText, setEstProCostText] = useState<string | null>(null);
  const [estProAssumptionsText, setEstProAssumptionsText] = useState<string | null>(null);
  const [estProClientDraftText, setEstProClientDraftText] = useState<string | null>(null);

  // Landscape Specialist Mode Text Sections
  const [landscapeRisksText, setLandscapeRisksText] = useState<string | null>(null);
  const [landscapeAdvisoryText, setLandscapeAdvisoryText] = useState<string | null>(null);

  // Bid Strategy Mode Text Sections
  const [bidPostureText, setBidPostureText] = useState<string | null>(null);
  const [bidRiskMapText, setBidRiskMapText] = useState<string | null>(null);
  const [bidPricingText, setBidPricingText] = useState<string | null>(null);
  const [bidClarificationsText, setBidClarificationsText] = useState<string | null>(null);
  const [bidFinalRecText, setBidFinalRecText] = useState<string | null>(null);

  // Risk Tracker Mode Text Sections
  const [riskTrackerSummaryText, setRiskTrackerSummaryText] = useState<string | null>(null);
  const [riskTrackerRevisionText, setRiskTrackerRevisionText] = useState<string | null>(null);
  const [riskTrackerRfiRiskText, setRiskTrackerRfiRiskText] = useState<string | null>(null);
  const [riskTrackerErosionText, setRiskTrackerErosionText] = useState<string | null>(null);
  const [riskTrackerActionsText, setRiskTrackerActionsText] = useState<string | null>(null);
  const [riskTrackerCOAssessmentText, setRiskTrackerCOAssessmentText] = useState<string | null>(null);

  // Drawing Submission Schedule Mode Text Sections
  const [drawSchedulingNotesText, setDrawSchedulingNotesText] = useState<string | null>(null);

  // Internal Schedule Planner Mode Text Sections
  const [internalOverviewText, setInternalOverviewText] = useState<string | null>(null);
  const [internalRevisionText, setInternalRevisionText] = useState<string | null>(null);
  const [internalQCText, setInternalQCText] = useState<string | null>(null);
  const [internalBottleneckText, setInternalBottleneckText] = useState<string | null>(null);
  const [internalSafetyText, setInternalSafetyText] = useState<string | null>(null);
  const [internalRecText, setInternalRecText] = useState<string | null>(null);

  // Quick Scan State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanLoading, setIsScanLoading] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<Attachment[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const chatServiceRef = useRef<ChatService | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize chat service once
    chatServiceRef.current = new ChatService();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- Helpers to parse Markdown-style tables from intakeResult ---
  const parseTableFromSection = (text: string, sectionKeyCandidates: string[]): TableData | null => {
    if (!text) return null;
    const lower = text.toLowerCase();
    // Find the earliest occurrence of any candidate
    let idx = -1;
    let foundKey = '';
    for (const k of sectionKeyCandidates) {
      const i = lower.indexOf(k.toLowerCase());
      if (i >= 0 && (idx === -1 || i < idx)) {
        idx = i;
        foundKey = k;
      }
    }
    if (idx === -1) return null;

    // Extract substring from foundKey to next two newlines or next numbered section "3." etc.
    let sub = text.substring(idx);
    // Trim off heading line
    // Find first line break after heading
    const firstLineBreak = sub.indexOf('\n');
    if (firstLineBreak >= 0) sub = sub.substring(firstLineBreak + 1);

    // Collect lines that look like table rows (contain pipe '|' or start with '-')
    const lines = sub.split('\n');
    const tableLines: string[] = [];
    for (let line of lines) {
      if (!line.trim()) {
        if (tableLines.length > 0) break; // end of contiguous table block
        else continue;
      }
      // Consider it a table line if it contains '|' character (markdown table) or pipe-separated content
      if (line.includes('|')) {
        tableLines.push(line.trim());
      } else {
        // if there is text but no '|' and we've already started collecting rows, treat as end
        if (tableLines.length > 0) break;
        // else continue searching
      }
    }

    if (tableLines.length === 0) return null;

    // Clean table lines: remove leading/trailing '|' and split on '|' to columns
    const cleaned = tableLines.map(l => {
      // Remove multiple spaces and trailing pipes
      let s = l.trim();
      if (s.startsWith('|')) s = s.substring(1);
      if (s.endsWith('|')) s = s.substring(0, s.length - 1);
      return s;
    });

    // If the first cleaned line looks like header (contains non-numeric words) use it as header.
    // If first line is a separator like --- then the previous line was header; handle both cases.
    let headers: string[] = [];
    let dataLines: string[] = [];

    if (cleaned.length >= 2 && /^[-\s|:]+$/.test(cleaned[1])) {
      // first line is header, second is separator
      headers = cleaned[0].split('|').map(h => h.trim()).filter(Boolean);
      dataLines = cleaned.slice(2);
    } else {
      // treat first line as header if it contains non-numeric words, otherwise use generic headers
      headers = cleaned[0].split('|').map(h => h.trim());
      dataLines = cleaned.slice(1);
      // if header contains many empty strings, create fallback headers
      if (headers.length <= 1) {
        // fallback: create columns numbered by largest row
        const maxCols = Math.max(...cleaned.map(l => l.split('|').length));
        headers = Array.from({ length: maxCols }).map((_, i) => `Col ${i+1}`);
      }
    }

    const rows = dataLines.map(l => l.split('|').map(c => c.trim()));

    return { headers, rows };
  };

  // Helper to extract text block for sections (Load Path, 3D Model)
  const parseTextSection = (fullText: string, sectionKey: string, nextSectionKeys: string[]): string | null => {
    if (!fullText) return null;
    const lower = fullText.toLowerCase();
    const startIdx = lower.indexOf(sectionKey.toLowerCase());
    if (startIdx === -1) return null;

    let endIdx = fullText.length;
    for (const nextKey of nextSectionKeys) {
        const idx = lower.indexOf(nextKey.toLowerCase(), startIdx + sectionKey.length);
        if (idx !== -1 && idx < endIdx) {
            endIdx = idx;
        }
    }
    
    // Find the end of the line containing the sectionKey to skip header
    const headerEndLineIdx = fullText.indexOf('\n', startIdx);
    if (headerEndLineIdx === -1 || headerEndLineIdx >= endIdx) return null;
    
    const content = fullText.substring(headerEndLineIdx + 1, endIdx).trim();
    return content.length > 0 ? content : null;
  };

  // Parse all tables whenever intakeResult changes
  useEffect(() => {
    if (!intakeResult) {
      setMissingTable(null);
      setMtoTable(null);
      setSummaryMaterialTable(null);
      setDrawingIndexTable(null);
      setGradeTable(null);
      setAnchorTable(null);
      setScopeTable(null);
      setConnectionTable(null);
      setSpecConflictTable(null);
      setTeklaPrefixTable(null);
      setTeklaMaterialTable(null);
      setTeklaProfileTable(null);
      setTeklaBoltTable(null);
      setIssueMissingDimsTable(null);
      setIssueConflictingTable(null);
      setIssueConnectionTable(null);
      setFabRuleTable(null);
      
      setEstProItemizedTable(null);
      setEstProTaskTable(null);
      setLandscapeScopeTable(null);
      setLandscapeRespTable(null);
      setLandscapeCountTable(null);
      setBidDriversTable(null);
      setRiskTrackerRegisterTable(null);
      setDrawSchedTable(null);
      setInternalStaffingTable(null);
      setInternalTaskTable(null);
      setInternalScheduleTable(null);
      
      setLoadPathText(null);
      setConceptualModelText(null);
      setAdvancedInterpretationText(null);
      setTeklaStartPackText(null);
      setMtoExportNotes(null);
      setMtoExtractionLog(null);
      setMtoRfiSuggestions(null);
      setCostWeightText(null);
      setClashCheckText(null);

      setEstProSummaryText(null);
      setEstProTotalHoursText(null);
      setEstProRiskBufferText(null);
      setEstProCostText(null);
      setEstProAssumptionsText(null);
      setEstProClientDraftText(null);

      setLandscapeRisksText(null);
      setLandscapeAdvisoryText(null);

      setBidPostureText(null);
      setBidRiskMapText(null);
      setBidPricingText(null);
      setBidClarificationsText(null);
      setBidFinalRecText(null);

      setRiskTrackerSummaryText(null);
      setRiskTrackerRevisionText(null);
      setRiskTrackerRfiRiskText(null);
      setRiskTrackerErosionText(null);
      setRiskTrackerActionsText(null);
      setRiskTrackerCOAssessmentText(null);

      setDrawSchedulingNotesText(null);

      setInternalOverviewText(null);
      setInternalRevisionText(null);
      setInternalQCText(null);
      setInternalBottleneckText(null);
      setInternalSafetyText(null);
      setInternalRecText(null);

      return;
    }

    // --- Legacy / Shared Tables ---
    const missing = parseTableFromSection(intakeResult, [
        '5. SMART ISSUE DETECTION', 'SMART ISSUE DETECTION', 
        'MISSING / WRONG / CONFLICTS', '2) MISSING / WRONG / CONFLICTS'
    ]);
    const mto = parseTableFromSection(intakeResult, [
        'OUTPUT 1 — COMPLETE MTO TABLE', 'COMPLETE MTO TABLE',
        '7. INITIAL MTO (ROUGH)', 'INITIAL MTO', 'INITIAL MTO (rough)', 
        '1. INITIAL MATERIAL TAKE-OFF', '1) INITIAL MATERIAL TAKE-OFF',
        '3) INITIAL MTO'
    ]);
    const sumMat = parseTableFromSection(intakeResult, [
        '2. KEY MATERIAL & FINISH SUMMARY', 'KEY MATERIAL & FINISH SUMMARY', 
        'KEY MATERIAL', '2) KEY MATERIAL'
    ]);

    // Phase-1 Tables
    // Updated keys to capture '1. DRAWING INDEX' as well as legacy '2. DRAWING INDEX' and numbered '1) '
    const dwgIndex = parseTableFromSection(intakeResult, [
        '1. DRAWING INDEX', '2. DRAWING INDEX', 'DRAWING INDEX + REVISION TRACKING', 'DRAWING INDEX',
        '1) DRAWING INDEX'
    ]);
    // Updated keys to capture '2. ANCHOR BOLT' as well as legacy '4. ANCHOR BOLT' and numbered '2) '
    const anchor = parseTableFromSection(intakeResult, [
        '2. ANCHOR BOLT', '4. ANCHOR BOLT', 'ANCHOR BOLT', '2) ANCHOR BOLT'
    ]);
    // Updated keys to capture '3. MATERIAL GRADE' and numbered '3) '
    const grade = parseTableFromSection(intakeResult, [
        '3. MATERIAL GRADE', 'MATERIAL GRADE NORMALIZATION', 'MATERIAL GRADE', '3) MATERIAL GRADE'
    ]);
    // Updated keys to capture '4. AUTO-SCOPE' as well as legacy '6. AUTO SCOPE' and numbered '4) '
    const scope = parseTableFromSection(intakeResult, [
        '4. AUTO-SCOPE', '6. AUTO SCOPE', 'AUTO SCOPE', 'AUTO-SCOPE', '4) AUTO-SCOPE'
    ]);

    // --- V3 / Phase 2 Tables ---
    const connection = parseTableFromSection(intakeResult, [
        '2. CONNECTION ASSUMPTION ENGINE', 'CONNECTION ASSUMPTION ENGINE', '2) CONNECTION ASSUMPTION ENGINE'
    ]);
    const conflict = parseTableFromSection(intakeResult, [
        '5. SPECIFICATION CONFLICT VALIDATOR', 'SPECIFICATION CONFLICT VALIDATOR', '5) SPECIFICATION CONFLICT VALIDATOR'
    ]);

    // --- Tekla Sub-tables (Legacy Phase 2) ---
    const teklaPrefix = parseTableFromSection(intakeResult, ['5.1 Prefix System', '6.1 Prefixing Rules', 'Prefixing Rules']);
    const teklaMat = parseTableFromSection(intakeResult, ['5.2 Normalized Material', '6.2 Material Catalog Normalization', 'Material Catalog Normalization']);
    const teklaProf = parseTableFromSection(intakeResult, ['5.3 Normalized Profile', '6.3 Profile Catalog Normalization', 'Profile Catalog Normalization']);
    const teklaBolt = parseTableFromSection(intakeResult, ['5.4 Bolt Catalog', '6.4 Bolt Catalog Selection', 'Bolt Catalog Selection']);

    // --- Issue Detector V2 Tables ---
    const issMissing = parseTableFromSection(intakeResult, ['Missing Dimensions', '1) MISSING DIMENSIONS']);
    const issConflict = parseTableFromSection(intakeResult, ['Conflicting Data', '2) CONFLICTING DATA']);
    const issConn = parseTableFromSection(intakeResult, ['Connection Ambiguities', '3) CONNECTION AMBIGUITIES']);

    // --- Phase-3 Tables ---
    const fabRules = parseTableFromSection(intakeResult, ['1. FABRICATION RULE CHECK', 'FABRICATION RULE CHECK']);

    // --- Estimation Pro Tables ---
    const estProItemized = parseTableFromSection(intakeResult, ['2. ITEMIZED PIECE-COUNT BREAKDOWN', 'ITEMIZED PIECE-COUNT']);
    const estProTask = parseTableFromSection(intakeResult, ['3. HOURS BY TASK CATEGORY', 'HOURS BY TASK']);

    // --- Landscape Specialist Tables ---
    const landScope = parseTableFromSection(intakeResult, ['1. LANDSCAPE / SITE STEEL SCOPE', 'LANDSCAPE / SITE STEEL SCOPE']);
    const landResp = parseTableFromSection(intakeResult, ['2. SCOPE RESPONSIBILITY', 'SCOPE RESPONSIBILITY']);
    const landCount = parseTableFromSection(intakeResult, ['4. LANDSCAPE STEEL', 'LANDSCAPE STEEL']);

    // --- Bid Strategy Tables ---
    const bidDrivers = parseTableFromSection(intakeResult, ['2. KEY BID DRIVERS', 'KEY BID DRIVERS']);

    // --- Risk Tracker Tables ---
    const riskRegister = parseTableFromSection(intakeResult, ['2. ACTIVE RISK REGISTER', 'ACTIVE RISK REGISTER']);

    // --- Drawing Submission Schedule Tables ---
    const drawSched = parseTableFromSection(intakeResult, ['1. DRAWING SUBMISSION SCHEDULE', 'DRAWING SUBMISSION SCHEDULE']);

    // --- Internal Schedule Planner Tables ---
    const internalStaffing = parseTableFromSection(intakeResult, ['2. AUTO STAFFING REQUIREMENT', 'AUTO STAFFING']);
    const internalTask = parseTableFromSection(intakeResult, ['3. TASK BREAKDOWN', 'TASK BREAKDOWN']);
    const internalSched = parseTableFromSection(intakeResult, ['4. INTERNAL SCHEDULE TARGETS', 'INTERNAL SCHEDULE']);


    // --- V3 Text Sections ---
    
    // New Phase 2 Section
    const advInterp = parseTextSection(intakeResult, '1. ADVANCED PROJECT INTERPRETATION', ['2. CONNECTION', 'CONNECTION ASSUMPTION', '2) CONNECTION']);
    // Handle the "1) ADVANCED PROJECT INTERPRETIVE SUMMARY" title variation
    const advInterp2 = parseTextSection(intakeResult, '1) ADVANCED PROJECT INTERPRETIVE SUMMARY', ['2) CONNECTION', '2. CONNECTION']);
    const advInterp3 = parseTextSection(intakeResult, '1) ADVANCED PROJECT INTERPRETATION', ['2) CONNECTION', '2. CONNECTION']);
    
    // 3. LOAD PATH -> Stops at 4.
    const loadPath = parseTextSection(intakeResult, '3. LOAD PATH UNDERSTANDING', ['4. 2D', '2D → 3D', '2D CONCEPTUAL', '4) 2D']);
    const loadPath2 = parseTextSection(intakeResult, '3) LOAD PATH UNDERSTANDING', ['4) 2D', '4. 2D']);
    
    // 4. 2D -> 3D -> Stops at 5.
    // Updated parser keys to include variations from both master prompt and Phase 2 prompt
    // New end keys for 5. SPECIFICATION
    const conceptual3d = parseTextSection(intakeResult, '4. 2D → 3D', ['5. TEKLA', 'TEKLA MODEL', 'SPECIFICATION CONFLICT', '5) TEKLA', '5. SPECIFICATION', '5) SPECIFICATION', '6. TEKLA', '6) TEKLA']);
    const conceptual3d2 = parseTextSection(intakeResult, '4) 2D → 3D', ['5) TEKLA', '5. TEKLA', '5. SPECIFICATION', '5) SPECIFICATION', '6. TEKLA', '6) TEKLA']);

    // 5. TEKLA MODEL START PACK (as text, if not parsed as tables)
    // Updated keys to include 6. TEKLA
    const teklaStartPack = parseTextSection(intakeResult, '5) TEKLA MODEL START PACK', []);
    const teklaStartPack2 = parseTextSection(intakeResult, '5. TEKLA MODEL START PACK', []);
    const teklaStartPack3 = parseTextSection(intakeResult, '6) TEKLA MODEL START PACK', []);
    const teklaStartPack4 = parseTextSection(intakeResult, '6. TEKLA MODEL START PACK', []);

    // MTO Sections
    const mtoNotes = parseTextSection(intakeResult, 'OUTPUT 2 — CSV headers line', ['OUTPUT 3', '3) OUTPUT 3']);
    const mtoNotesLegacy = parseTextSection(intakeResult, '2. CSV/Excel-ready headers line', []);
    
    const mtoExtLog = parseTextSection(intakeResult, 'OUTPUT 3 — EXTRACTION LOG', ['OUTPUT 4', '4) OUTPUT 4']);
    const mtoRfi = parseTextSection(intakeResult, 'OUTPUT 4 — RFI SUGGESTIONS FOR MTO', []);

    // Phase 3 Text Sections
    const costWeight = parseTextSection(intakeResult, '2. COST & WEIGHT ESTIMATE', ['3. AUTOMATED CLASH', 'AUTOMATED CLASH CHECK']);
    const clashCheck = parseTextSection(intakeResult, '3. AUTOMATED CLASH CHECK SUMMARY', []);

    // Estimation Pro Text Sections
    const estProSummary = parseTextSection(intakeResult, '1. ESTIMATION SUMMARY', ['2. ITEMIZED']);
    const estProTotalHours = parseTextSection(intakeResult, '4. TOTAL ESTIMATED HOURS', ['5. RISK BUFFER']);
    const estProRisk = parseTextSection(intakeResult, '5. RISK BUFFER', ['6. COST CONVERSION']);
    const estProCost = parseTextSection(intakeResult, '6. COST CONVERSION', ['7. ASSUMPTIONS']);
    const estProAssumptions = parseTextSection(intakeResult, '7. ASSUMPTIONS', ['8. OPTIONAL']);
    const estProDraft = parseTextSection(intakeResult, '8. OPTIONAL CLIENT-FACING', []);

    // Landscape Specialist Text Sections
    const landRisks = parseTextSection(intakeResult, '3. LANDSCAPE-SPECIFIC', ['4. LANDSCAPE STEEL']);
    const landAdvise = parseTextSection(intakeResult, '5. ESTIMATION', []);

    // Bid Strategy Text Sections
    const bidPosture = parseTextSection(intakeResult, '1. BID POSTURE RECOMMENDATION', ['2. KEY BID DRIVERS']);
    const bidRisk = parseTextSection(intakeResult, '3. RISK MAP', ['4. PRICING STRATEGY']);
    const bidPrice = parseTextSection(intakeResult, '4. PRICING STRATEGY ADVICE', ['5. RECOMMENDED CLARIFICATIONS']);
    const bidClarif = parseTextSection(intakeResult, '5. RECOMMENDED CLARIFICATIONS', ['6. FINAL INTERNAL']);
    const bidFinal = parseTextSection(intakeResult, '6. FINAL INTERNAL RECOMMENDATION', []);

    // Risk Tracker Text Sections
    const riskSummary = parseTextSection(intakeResult, '1. PROJECT RISK STATUS', ['2. ACTIVE RISK REGISTER']);
    const riskRevision = parseTextSection(intakeResult, '3. REVISION & CHANGE WATCH', ['4. RFI & ASSUMPTION RISK']);
    const riskRfi = parseTextSection(intakeResult, '4. RFI & ASSUMPTION RISK', ['5. MARGIN EROSION ALERTS']);
    const riskErosion = parseTextSection(intakeResult, '5. MARGIN EROSION ALERTS', ['6. RECOMMENDED ACTIONS']);
    const riskActions = parseTextSection(intakeResult, '6. RECOMMENDED ACTIONS', ['7. CHANGE ORDER READINESS']);
    const riskCO = parseTextSection(intakeResult, '7. CHANGE ORDER READINESS ASSESSMENT', []);

    // Drawing Submission Schedule Text Sections
    const drawSchedulingNotes = parseTextSection(intakeResult, 'SCHEDULING NOTES', ['GLOBAL RULES']);

    // Internal Schedule Planner Text Sections
    const internalOverview = parseTextSection(intakeResult, '1. PROJECT EXECUTION OVERVIEW', ['2. AUTO STAFFING']);
    const internalRevision = parseTextSection(intakeResult, '5. REVISION & REWORK', ['6. QUALITY CONTROL']);
    const internalQC = parseTextSection(intakeResult, '6. QUALITY CONTROL', ['7. BOTTLENECK']);
    const internalBottleneck = parseTextSection(intakeResult, '7. BOTTLENECK', ['8. PROFIT']);
    const internalSafety = parseTextSection(intakeResult, '8. PROFIT', ['9. FINAL INTERNAL']);
    const internalRec = parseTextSection(intakeResult, '9. FINAL INTERNAL RECOMMENDATION', []);


    setMissingTable(missing);
    setMtoTable(mto);
    setSummaryMaterialTable(sumMat);
    setDrawingIndexTable(dwgIndex);
    setGradeTable(grade);
    setAnchorTable(anchor);
    setScopeTable(scope);

    setConnectionTable(connection);
    setSpecConflictTable(conflict);
    setTeklaPrefixTable(teklaPrefix);
    setTeklaMaterialTable(teklaMat);
    setTeklaProfileTable(teklaProf);
    setTeklaBoltTable(teklaBolt);
    
    setIssueMissingDimsTable(issMissing);
    setIssueConflictingTable(issConflict);
    setIssueConnectionTable(issConn);

    setFabRuleTable(fabRules);
    setEstProItemizedTable(estProItemized);
    setEstProTaskTable(estProTask);
    
    setLandscapeScopeTable(landScope);
    setLandscapeRespTable(landResp);
    setLandscapeCountTable(landCount);

    setBidDriversTable(bidDrivers);
    setRiskTrackerRegisterTable(riskRegister);
    setDrawSchedTable(drawSched);
    
    setInternalStaffingTable(internalStaffing);
    setInternalTaskTable(internalTask);
    setInternalScheduleTable(internalSched);

    setLoadPathText(loadPath || loadPath2);
    setConceptualModelText(conceptual3d || conceptual3d2);
    setAdvancedInterpretationText(advInterp || advInterp2 || advInterp3);
    setTeklaStartPackText(teklaStartPack || teklaStartPack2 || teklaStartPack3 || teklaStartPack4);
    setMtoExportNotes(mtoNotes || mtoNotesLegacy);
    setMtoExtractionLog(mtoExtLog);
    setMtoRfiSuggestions(mtoRfi);
    
    setCostWeightText(costWeight);
    setClashCheckText(clashCheck);

    setEstProSummaryText(estProSummary);
    setEstProTotalHoursText(estProTotalHours);
    setEstProRiskBufferText(estProRisk);
    setEstProCostText(estProCost);
    setEstProAssumptionsText(estProAssumptions);
    setEstProClientDraftText(estProDraft);
    
    setLandscapeRisksText(landRisks);
    setLandscapeAdvisoryText(landAdvise);

    setBidPostureText(bidPosture);
    setBidRiskMapText(bidRisk);
    setBidPricingText(bidPrice);
    setBidClarificationsText(bidClarif);
    setBidFinalRecText(bidFinal);

    setRiskTrackerSummaryText(riskSummary);
    setRiskTrackerRevisionText(riskRevision);
    setRiskTrackerRfiRiskText(riskRfi);
    setRiskTrackerErosionText(riskErosion);
    setRiskTrackerActionsText(riskActions);
    setRiskTrackerCOAssessmentText(riskCO);

    setDrawSchedulingNotesText(drawSchedulingNotes);
    
    setInternalOverviewText(internalOverview);
    setInternalRevisionText(internalRevision);
    setInternalQCText(internalQC);
    setInternalBottleneckText(internalBottleneck);
    setInternalSafetyText(internalSafety);
    setInternalRecText(internalRec);

  }, [intakeResult]);

  // --- Export helpers ---
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    // Build CSV string
    const escape = (s: string) => {
      if (s == null) return '';
      const str = String(s).replace(/\r?\n/g, ' ');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [];
    csvRows.push(headers.map(escape).join(','));
    rows.forEach(r => {
      // ensure same number of columns
      const normalized = headers.map((_, i) => escape(r[i] ?? ''));
      csvRows.push(normalized.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (filename: string, headers: string[], rows: string[][]) => {
    const arr = rows.map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? '';
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Rest of your existing code (handlers, file processing, chat)
  const handleDeepAnalysis = async () => {
    if (!intakeInput.trim() && attachments.length === 0) return;
    setIsIntakeLoading(true);
    setIntakeError(null);
    try {
      // Map UI Mode to Prompt Trigger string
      let modeString = 'MASTER_INTAKE';
      if (analysisMode === 'PHASE_2') modeString = 'PHASE-2';
      else if (analysisMode === 'PHASE_1') modeString = 'PHASE-1';
      else if (analysisMode === 'PHASE_3') modeString = 'PHASE-3';
      else if (analysisMode === 'SUMMARIZER') modeString = 'SUMMARY';
      else if (analysisMode === 'ISSUE_DETECTOR') modeString = 'ISSUE_DETECTOR';
      else if (analysisMode === 'MTO') modeString = 'MTO';
      else if (analysisMode === 'ESTIMATION_PRO') modeString = 'ESTIMATION_PRO';
      else if (analysisMode === 'LANDSCAPE_SITE_STEEL_SPECIALIST') modeString = 'LANDSCAPE_SITE_STEEL_SPECIALIST';
      else if (analysisMode === 'BID_STRATEGY') modeString = 'BID_STRATEGY';
      else if (analysisMode === 'POST_AWARD_RISK_TRACKER') modeString = 'POST_AWARD_RISK_TRACKER';
      else if (analysisMode === 'DRAWING_SUBMISSION_SCHEDULE') modeString = 'DRAWING_SUBMISSION_SCHEDULE';
      else if (analysisMode === 'INTERNAL_SCHEDULE_PLANNER') modeString = 'INTERNAL_SCHEDULE_PLANNER';

      // Prepend the mode trigger to the input so the Unified Prompt knows what to do
      const finalInput = `Run Mode: ${modeString}\n\n${intakeInput}`;

      // Always use the single Unified System Prompt
      const result = await runDeepIntakeAnalysis(finalInput, attachments, STEEL_INTAKE_SYSTEM_PROMPT);
      setIntakeResult(result);
    } catch (err: any) {
      setIntakeError(err.message || 'Analysis failed');
    } finally {
      setIsIntakeLoading(false);
    }
  };

  const handleQuickScan = async () => {
    if (!intakeInput.trim() && attachments.length === 0) return;
    setIsScanLoading(true);
    try {
      const result = await runQuickScan(intakeInput, attachments);
      setScanResult(result);
    } catch (err: any) {
      setScanResult(`Error: ${err.message}`);
    } finally {
      setIsScanLoading(false);
    }
  };

  const loadSampleData = () => {
     setIntakeInput(SAMPLE_PROJECT_DATA);
  };

  const processFiles = (files: File[], callback: (att: Attachment) => void) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        
        const [header, base64Data] = result.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        
        callback({
          name: file.name,
          mimeType: mimeType,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files), (att) => {
        setAttachments(prev => [...prev, att]);
      });
    }
    e.target.value = '';
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files), (att) => {
        setChatAttachments(prev => [...prev, att]);
      });
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeChatAttachment = (index: number) => {
    setChatAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!chatInput.trim() && chatAttachments.length === 0) || isChatLoading) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: chatInput, 
      attachments: [...chatAttachments],
      timestamp: Date.now() 
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatAttachments([]);
    setIsChatLoading(true);

    try {
      const responseText = await chatServiceRef.current?.sendMessage(userMsg.text, userMsg.attachments) || "Error sending message.";
      const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error.", timestamp: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getRunButtonLabel = (mode: 'DEEP' | 'SCAN') => {
    let base = 'RUN ANALYSIS';
    if (mode === 'SCAN') base = 'RUN QUICK SCAN';
    else if (analysisMode === 'MASTER') base = 'RUN MASTER AUDIT';
    else if (analysisMode === 'PHASE_1') base = 'RUN PHASE 1 (INDEX)';
    else if (analysisMode === 'PHASE_2') base = 'RUN PHASE 2 (ENG)';
    else if (analysisMode === 'PHASE_3') base = 'RUN PHASE 3 (FAB/COST)';
    else if (analysisMode === 'SUMMARIZER') base = 'GENERATE SUMMARY';
    else if (analysisMode === 'ISSUE_DETECTOR') base = 'DETECT ISSUES';
    else if (analysisMode === 'MTO') base = 'GENERATE MTO';
    else if (analysisMode === 'ESTIMATION_PRO') base = 'GENERATE ADVANCED QUOTE';
    else if (analysisMode === 'LANDSCAPE_SITE_STEEL_SPECIALIST') base = 'RUN LANDSCAPE ANALYSIS';
    else if (analysisMode === 'BID_STRATEGY') base = 'RUN BID STRATEGY';
    else if (analysisMode === 'POST_AWARD_RISK_TRACKER') base = 'RUN RISK TRACKER';
    else if (analysisMode === 'DRAWING_SUBMISSION_SCHEDULE') base = 'GENERATE DRAWING SCHEDULE';
    else if (analysisMode === 'INTERNAL_SCHEDULE_PLANNER') base = 'GENERATE EXECUTION PLAN';

    const parts = [];
    if (intakeInput.trim()) parts.push('Text');
    if (attachments.length > 0) parts.push(`${attachments.length} File${attachments.length > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return base;
    return `${base} (${parts.join(' & ')})`;
  };

  // Reusable table renderer - MODERNIZED
  const renderTableSection = (title: string, table: TableData | null, filenameBase: string) => {
      if (!table) return null;
      return (
         <div className="mt-8 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{title}</h3>
             <div className="flex gap-3">
               <button
                 onClick={() => downloadCSV(`${filenameBase}.csv`, table.headers, table.rows)}
                 className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white px-4 py-2 rounded-full transition-all shadow-md hover:shadow-indigo-500/30"
               >
                 CSV
               </button>
               <button
                 onClick={() => downloadJSON(`${filenameBase}.json`, table.headers, table.rows)}
                 className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full transition-all"
               >
                 JSON
               </button>
             </div>
           </div>

           <div className="overflow-x-auto rounded-xl border border-gray-800">
             <table className="min-w-full text-left text-sm">
               <thead className="bg-gray-800/80">
                 <tr>
                   {table.headers.map((h, i) => (
                     <th key={i} className="px-4 py-3 text-gray-300 font-medium border-b border-gray-700">{h}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800">
                 {table.rows.map((row, rIdx) => (
                   <tr key={rIdx} className="even:bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                     {table.headers.map((_, cIdx) => (
                       <td key={cIdx} className="px-4 py-3 text-gray-200 whitespace-pre-wrap">
                         {row[cIdx] ?? ''}
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      );
  };

  const renderTextSection = (title: string, content: string | null) => {
    if (!content) return null;
    return (
        <div className="mt-8 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-indigo-400 mb-4">{title}</h3>
            <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap text-gray-300 bg-gray-950/50 p-4 rounded-xl border border-gray-800">
                {content}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white font-sans antialiased">
      
      {/* Header - Modern Glass Effect */}
      <header className="flex-none h-16 bg-gray-900/70 backdrop-blur-xl border-b border-gray-800/50 flex items-center px-6 justify-between z-10 shadow-2xl relative">
        <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                 <BoltIcon />
            </div>
            <div>
                 <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">SteelSight</h1>
                 <p className="text-xs text-gray-500 font-mono">INTELLIGENT INTAKE</p>
            </div>
        </div>

        {/* Centered custom app title - ThinLineDimensions */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <h2
            className="text-lg md:text-2xl font-extrabold tracking-wide leading-tight bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
            style={{ fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}
          >
            <span className="text-red-400">B</span>lueprint
            <span className="ml-1"><span className="text-red-400">A</span></span>I
          </h2>
          <div
            className="text-xs md:text-sm text-gray-500 -mt-1"
            style={{ fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}
          >
            Designed by Nikunj Shah
          </div>
        </div>

        <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab(AppMode.DEEP_INTAKE)}
            className={`flex items-center px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === AppMode.DEEP_INTAKE 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
            }`}
          >
            <BrainIcon />
            <span className="ml-2">Deep Intake</span>
          </button>
          <button
            onClick={() => setActiveTab(AppMode.QUICK_SCAN)}
            className={`flex items-center px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === AppMode.QUICK_SCAN 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
            }`}
          >
            <SparklesIcon />
            <span className="ml-2">Quick Scan</span>
          </button>
          <button
            onClick={() => setActiveTab(AppMode.CHAT)}
            className={`flex items-center px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === AppMode.CHAT 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
            }`}
          >
            <ChatBubbleIcon />
            <span className="ml-2">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex relative">
        
        {/* Input Panel (Shared for Intake/Scan) - Modern Glass Sidebar */}
        {(activeTab === AppMode.DEEP_INTAKE || activeTab === AppMode.QUICK_SCAN) && (
          <div className="w-1/3 min-w-[350px] max-w-md border-r border-gray-800/50 flex flex-col bg-gray-900/40 backdrop-blur-sm">
            <div className="p-5 border-b border-gray-800 bg-gray-900/60 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
                   Project Source Data
                </h2>
                <p className="text-xs text-gray-500">Upload specs/drawings or paste text fragments.</p>
              </div>
              <button onClick={loadSampleData} className="text-xs text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/30">
                  Load Sample
              </button>
            </div>
            
            <div className="flex-1 p-5 relative flex flex-col space-y-4">
              <div className="flex-1 relative bg-gray-950/70 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                <textarea
                  value={intakeInput}
                  onChange={(e) => setIntakeInput(e.target.value)}
                  placeholder="Paste raw project text here (e.g., 'Sheet S-101: Columns W12x53...')"
                  className="flex-1 w-full bg-transparent p-5 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none placeholder-gray-600"
                />
              </div>

               {/* Dedicated Upload Button */}
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden" 
                  multiple
                  accept=".txt,.pdf,image/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-3 text-sm font-medium text-gray-200 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 py-3.5 rounded-xl transition-all shadow-lg group"
                >
                  <span className="text-gray-400 group-hover:text-indigo-400 transition-colors">
                     <CloudArrowUpIcon />
                  </span>
                  <span>Upload Files for Analysis</span>
                </button>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto bg-gray-950/40 rounded-xl p-3 border border-gray-800/50 backdrop-blur-sm">
                   <div className="flex justify-between items-center px-1 mb-1">
                      <span className="text-xs font-semibold text-gray-400">ATTACHED ({attachments.length})</span>
                      <button onClick={() => setAttachments([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                   </div>
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-800/80 text-gray-300 text-xs px-4 py-2.5 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-all">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="text-gray-400 shrink-0">
                           <PaperClipIcon />
                        </span>
                        <span className="truncate font-medium">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="text-gray-500 hover:text-red-400 p-1 shrink-0"
                        title="Remove file"
                      >
                        <XMarkIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-800 bg-gray-900/60">
              {activeTab === AppMode.DEEP_INTAKE && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Analysis Mode</label>
                    <select
                      value={analysisMode}
                      onChange={(e) => setAnalysisMode(e.target.value)}
                      className="w-full bg-gray-950 text-gray-300 text-sm border border-gray-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-gray-900"
                    >
                      <option value="MASTER">Full Project Audit (Master)</option>
                      <option value="PHASE_1">Phase-1 (Index/Scope/Anchors)</option>
                      <option value="PHASE_2">Phase-2 (Advanced Engineering)</option>
                      <option value="PHASE_3">Phase-3 (Fab/Cost)</option>
                      <option value="SUMMARIZER">Project Summary Only</option>
                      <option value="ISSUE_DETECTOR">Issue Detection</option>
                      <option value="MTO">Initial MTO</option>
                      <option value="ESTIMATION_PRO">Estimation Pro (Advanced)</option>
                      <option value="LANDSCAPE_SITE_STEEL_SPECIALIST">Landscape & Site Steel Specialist</option>
                      <option value="BID_STRATEGY">Bid Strategy & Risk Advisor</option>
                      <option value="POST_AWARD_RISK_TRACKER">Post-Award Risk Tracker</option>
                      <option value="DRAWING_SUBMISSION_SCHEDULE">Drawing Submission Schedule</option>
                      <option value="INTERNAL_SCHEDULE_PLANNER">Internal Schedule Planner</option>
                    </select>
                  </div>
              )}

              {activeTab === AppMode.DEEP_INTAKE ? (
                <button
                  onClick={handleDeepAnalysis}
                  disabled={isIntakeLoading || (!intakeInput.trim() && attachments.length === 0)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex justify-center items-center ${
                    isIntakeLoading || (!intakeInput.trim() && attachments.length === 0)
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/20'
                  }`}
                >
                  {isIntakeLoading ? <span className="animate-pulse">ANALYZING...</span> : getRunButtonLabel('DEEP')}
                </button>
              ) : (
                <button
                  onClick={handleQuickScan}
                  disabled={isScanLoading || (!intakeInput.trim() && attachments.length === 0)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex justify-center items-center ${
                    isScanLoading || (!intakeInput.trim() && attachments.length === 0)
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-xl shadow-amber-600/20'
                  }`}
                >
                   {isScanLoading ? <Spinner /> : getRunButtonLabel('SCAN')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-950/50 relative">
          
          {/* DEEP INTAKE MODE */}
          {activeTab === AppMode.DEEP_INTAKE && (
            <div className="p-8 max-w-5xl mx-auto">
              {isIntakeLoading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                  <ThinkingIndicator />
                  <p className="text-gray-500 text-sm animate-pulse">
                      {analysisMode === 'MASTER' ? "Analyzing project deeply..." : 
                       analysisMode === 'PHASE_2' ? "Running advanced engineering analysis..." :
                       analysisMode === 'PHASE_1' ? "Running Phase-1 intake..." :
                       analysisMode === 'PHASE_3' ? "Running fabrication & cost analysis..." :
                       analysisMode === 'ESTIMATION_PRO' ? "Generating advanced estimation report..." :
                       analysisMode === 'LANDSCAPE_SITE_STEEL_SPECIALIST' ? "Analyzing landscape & site steel..." :
                       analysisMode === 'BID_STRATEGY' ? "Formulating bid strategy..." :
                       analysisMode === 'POST_AWARD_RISK_TRACKER' ? "Tracking post-award risks..." :
                       analysisMode === 'DRAWING_SUBMISSION_SCHEDULE' ? "Generating drawing schedule..." :
                       analysisMode === 'INTERNAL_SCHEDULE_PLANNER' ? "Generating execution plan..." :
                       "Running modular analysis..."}
                  </p>
                </div>
              ) : intakeResult ? (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                        <div className="flex items-baseline space-x-3">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Intake Report</h2>
                            <span className="text-sm text-gray-400 uppercase tracking-wide px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
                                {analysisMode.replace('_', ' ')}
                            </span>
                        </div>
                        <span className="bg-gray-800/80 text-indigo-300 text-xs px-3 py-1.5 rounded-full border border-indigo-500/30 backdrop-blur-sm">Gemini 3 Pro</span>
                    </div>

                   {/* Markdown output (Full report) */}
                   <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
                     <MarkdownDisplay content={intakeResult} />
                   </div>

                   {/* V3 Specific Sections extracted for emphasis/export */}
                   {renderTextSection("ADVANCED PROJECT INTERPRETATION", advancedInterpretationText)}
                   {renderTextSection("LOAD PATH UNDERSTANDING", loadPathText)}
                   {renderTextSection("2D → 3D CONCEPTUAL MODEL", conceptualModelText)}
                   
                   {renderTableSection("CONNECTION ASSUMPTIONS", connectionTable, "connection_assumptions")}
                   {renderTableSection("SPECIFICATION CONFLICTS", specConflictTable, "spec_conflicts")}

                   {/* Tekla Start Pack Text (Phase 2 new version) */}
                   {renderTextSection("TEKLA MODEL START PACK", teklaStartPackText)}

                   {/* Tekla Start Pack Tables (Legacy Phase 2) - Only show if parsed as tables */}
                   {teklaPrefixTable && renderTableSection("TEKLA: PREFIXING RULES", teklaPrefixTable, "tekla_prefixing")}
                   {teklaMaterialTable && renderTableSection("TEKLA: MATERIAL CATALOG", teklaMaterialTable, "tekla_materials")}
                   {teklaProfileTable && renderTableSection("TEKLA: PROFILE CATALOG", teklaProfileTable, "tekla_profiles")}
                   {teklaBoltTable && renderTableSection("TEKLA: BOLT CATALOG", teklaBoltTable, "tekla_bolts")}

                   {/* Phase-1 & Legacy Tables (If present in output) */}
                   {renderTableSection("DRAWING INDEX & REVISIONS", drawingIndexTable, "drawing_index")}
                   {renderTableSection("MATERIAL GRADES", gradeTable, "material_grades")}
                   {renderTableSection("ANCHOR BOLTS & BASEPLATES", anchorTable, "anchor_bolts")}
                   {renderTableSection("SCOPE DETECTION", scopeTable, "scope_items")}
                   
                   {/* Summary Mode Table */}
                   {renderTableSection("MATERIAL & FINISH SUMMARY", summaryMaterialTable, "material_finish_summary")}

                   {/* Issue Detector Tables */}
                   {renderTableSection("MISSING DIMENSIONS", issueMissingDimsTable, "issues_missing_dims")}
                   {renderTableSection("CONFLICTING DATA", issueConflictingTable, "issues_conflicting")}
                   {renderTableSection("CONNECTION AMBIGUITIES", issueConnectionTable, "issues_connection")}

                   {/* Phase 3 Tables & Text */}
                   {renderTableSection("FABRICATION RULE CHECK", fabRuleTable, "fab_rules")}
                   {renderTextSection("COST & WEIGHT ESTIMATE", costWeightText)}
                   {renderTextSection("AUTOMATED CLASH CHECK", clashCheckText)}

                   {/* MTO Tables & Text */}
                   {renderTableSection("COMPLETE MTO TABLE", mtoTable, "complete_mto")}
                   {renderTextSection("CSV HEADERS", mtoExportNotes)}
                   {renderTextSection("EXTRACTION LOG", mtoExtractionLog)}
                   {renderTextSection("MTO RFI SUGGESTIONS", mtoRfiSuggestions)}

                   {/* Estimation Sections (Removed - Pro mode only now) */}

                   {/* Estimation Pro Sections */}
                   {renderTextSection("ESTIMATION SUMMARY", estProSummaryText)}
                   {renderTableSection("ITEMIZED PIECE-COUNT BREAKDOWN", estProItemizedTable, "estimate_itemized_breakdown")}
                   {renderTableSection("HOURS BY TASK CATEGORY", estProTaskTable, "estimate_hours_by_task")}
                   {renderTextSection("TOTAL ESTIMATED HOURS & CONFIDENCE", estProTotalHoursText)}
                   {renderTextSection("RISK BUFFER", estProRiskBufferText)}
                   {renderTextSection("COST CONVERSION (USD)", estProCostText)}
                   {renderTextSection("ASSUMPTIONS & EXCLUSIONS", estProAssumptionsText)}
                   {renderTextSection("CLIENT-FACING QUOTATION DRAFT", estProClientDraftText)}

                   {/* Landscape Specialist Sections */}
                   {renderTableSection("LANDSCAPE / SITE STEEL SCOPE", landscapeScopeTable, "landscape_scope")}
                   {renderTableSection("SCOPE RESPONSIBILITY CLASSIFICATION", landscapeRespTable, "landscape_responsibility")}
                   {renderTextSection("LANDSCAPE-SPECIFIC DETAILING RISKS", landscapeRisksText)}
                   {renderTableSection("LANDSCAPE STEEL PIECE COUNT", landscapeCountTable, "landscape_piece_count")}
                   {renderTextSection("ESTIMATION & QUOTATION IMPACT (ADVISORY)", landscapeAdvisoryText)}

                   {/* Bid Strategy Sections */}
                   {renderTextSection("BID POSTURE RECOMMENDATION", bidPostureText)}
                   {renderTableSection("KEY BID DRIVERS", bidDriversTable, "bid_drivers")}
                   {renderTextSection("RISK MAP", bidRiskMapText)}
                   {renderTextSection("PRICING STRATEGY ADVICE", bidPricingText)}
                   {renderTextSection("RECOMMENDED CLARIFICATIONS", bidClarificationsText)}
                   {renderTextSection("FINAL INTERNAL RECOMMENDATION", bidFinalRecText)}

                   {/* Risk Tracker Sections */}
                   {renderTextSection("PROJECT RISK STATUS (SUMMARY)", riskTrackerSummaryText)}
                   {renderTableSection("ACTIVE RISK REGISTER", riskTrackerRegisterTable, "risk_register")}
                   {renderTextSection("REVISION & CHANGE WATCH", riskTrackerRevisionText)}
                   {renderTextSection("RFI & ASSUMPTION RISK", riskTrackerRfiRiskText)}
                   {renderTextSection("MARGIN EROSION ALERTS", riskTrackerErosionText)}
                   {renderTextSection("RECOMMENDED ACTIONS", riskTrackerActionsText)}
                   {renderTextSection("CHANGE ORDER READINESS", riskTrackerCOAssessmentText)}

                   {/* Drawing Submission Schedule Sections */}
                   {renderTableSection("DRAWING SUBMISSION SCHEDULE (CLIENT-FACING)", drawSchedTable, "drawing_schedule")}
                   {renderTextSection("SCHEDULING NOTES (CLIENT-FACING)", drawSchedulingNotesText)}

                   {/* Internal Schedule Planner Sections */}
                   {renderTextSection("PROJECT EXECUTION OVERVIEW", internalOverviewText)}
                   {renderTableSection("AUTO STAFFING REQUIREMENT", internalStaffingTable, "staffing_requirement")}
                   {renderTableSection("TASK BREAKDOWN & ROLE ASSIGNMENT", internalTaskTable, "task_breakdown")}
                   {renderTableSection("INTERNAL SCHEDULE TARGETS", internalScheduleTable, "internal_schedule")}
                   {renderTextSection("REVISION & REWORK ALLOCATION", internalRevisionText)}
                   {renderTextSection("QUALITY CONTROL PLAN", internalQCText)}
                   {renderTextSection("BOTTLENECK & OVERLOAD WARNINGS", internalBottleneckText)}
                   {renderTextSection("PROFIT & DELIVERY SAFETY INDICATORS", internalSafetyText)}
                   {renderTextSection("FINAL INTERNAL RECOMMENDATION", internalRecText)}


                   {/* Common Tables */}
                   {renderTableSection("DETECTED ISSUES & CONFLICTS", missingTable, "detected_issues")}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
                  <BrainIcon />
                  <p className="mt-4 text-lg">Ready for heavy lifting.</p>
                  <p className="text-sm">Select analysis mode, paste data, and run.</p>
                </div>
              )}
            </div>
          )}

          {/* QUICK SCAN MODE */}
          {activeTab === AppMode.QUICK_SCAN && (
            <div className="p-8 max-w-4xl mx-auto">
              {isScanLoading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <Spinner />
                </div>
              ) : scanResult ? (
                <div className="animate-fade-in bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-800">
                         <div className="p-1 bg-amber-500/20 rounded">
                             <SparklesIcon />
                         </div>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Fast Scan Results</h2>
                    </div>
                  <MarkdownDisplay content={scanResult} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
                  <SparklesIcon />
                  <p className="mt-4 text-lg">Need answers fast?</p>
                  <p className="text-sm">Use Quick Scan for rapid insights.</p>
                </div>
              )}
            </div>
          )}

          {/* CHAT MODE */}
          {activeTab === AppMode.CHAT && (
            <div className="flex flex-col h-full max-w-5xl mx-auto border-x border-gray-800/50 bg-gray-950/30 backdrop-blur-sm">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <ChatBubbleIcon />
                    <p className="mt-4">Ask me anything about the project or steel detailing.</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                          : 'bg-gray-800/80 text-gray-200 border border-gray-700 rounded-bl-none backdrop-blur-sm'
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                           {msg.attachments.map((att, i) => (
                             <div key={i} className="bg-black/30 rounded-lg p-2 flex items-center space-x-2 border border-white/10 max-w-full">
                                {att.mimeType.startsWith('image/') ? (
                                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="h-10 w-10 object-cover rounded" />
                                ) : (
                                    <PaperClipIcon />
                                )}
                                <span className="text-xs truncate max-w-[120px]">{att.name}</span>
                             </div>
                           ))}
                        </div>
                      )}
                      <MarkdownDisplay content={msg.text} />
                    </div>
                  </div>
                ))}
                 {isChatLoading && (
                     <div className="flex justify-start">
                         <div className="bg-gray-800/50 rounded-2xl px-4 py-2 rounded-bl-none">
                             <Spinner />
                         </div>
                     </div>
                 )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 bg-gray-900/70 backdrop-blur-sm border-t border-gray-800">
                {/* Chat Attachment Preview */}
                {chatAttachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {chatAttachments.map((att, i) => (
                            <div key={i} className="relative bg-gray-800 px-3 py-2 rounded-xl flex items-center space-x-2 border border-gray-700 shrink-0">
                                <span className="text-xs text-gray-300 truncate max-w-[100px]">{att.name}</span>
                                <button onClick={() => removeChatAttachment(i)} className="text-gray-400 hover:text-white">
                                    <XMarkIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <input 
                      type="file" 
                      ref={chatFileInputRef}
                      onChange={handleChatFileSelect}
                      className="hidden" 
                      multiple
                      accept=".txt,.pdf,image/*"
                  />
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-3 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all"
                    title="Upload file"
                  >
                    <PaperClipIcon />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={(!chatInput.trim() && chatAttachments.length === 0) || isChatLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-700 text-white px-6 rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;