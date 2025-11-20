import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface ExcelRow {
  category: string;
  mainItem: string;
  subItem?: string;
  currentBudget: number;
}

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ExcelRow[]) => Promise<void>;
  projectId: string;
}

type ImportStep = 'upload' | 'map' | 'preview' | 'importing';

export default function ExcelImportDialog({
  isOpen,
  onClose,
  onImport,
  projectId,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [excelData, setExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    category: '',
    mainItem: '',
    subItem: '',
    currentBudget: '',
  });
  const [mappedData, setMappedData] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = [
      {
        분류: '공사비',
        항목: '토목공사',
        소항목: '기초공사',
        예산금액: 50000000,
      },
      {
        분류: '공사비',
        항목: '건축공사',
        소항목: '골조공사',
        예산금액: 120000000,
      },
      {
        분류: '설계비',
        항목: '건축설계',
        소항목: '',
        예산금액: 30000000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '예산항목');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // 분류
      { wch: 20 }, // 항목
      { wch: 20 }, // 소항목
      { wch: 15 }, // 예산금액
    ];

    XLSX.writeFile(wb, '예산_가져오기_양식.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      if (data.length === 0) {
        alert('엑셀 파일이 비어있습니다');
        return;
      }

      // Get headers from first row
      const firstRow = data[0] as any;
      const detectedHeaders = Object.keys(firstRow);

      setHeaders(detectedHeaders);
      setExcelData(data);

      // Auto-detect column mapping
      const autoMap: Record<string, string> = {
        category: '',
        mainItem: '',
        subItem: '',
        currentBudget: '',
      };

      detectedHeaders.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes('분류') || lower.includes('카테고리') || lower === 'category') {
          autoMap.category = header;
        } else if (
          lower.includes('대항목') ||
          lower.includes('항목') ||
          lower === 'mainitem' ||
          lower === 'item'
        ) {
          autoMap.mainItem = header;
        } else if (
          lower.includes('소항목') ||
          lower.includes('세부') ||
          lower === 'subitem' ||
          lower === 'sub'
        ) {
          autoMap.subItem = header;
        } else if (
          lower.includes('예산') ||
          lower.includes('금액') ||
          lower === 'budget' ||
          lower === 'amount'
        ) {
          autoMap.currentBudget = header;
        }
      });

      setColumnMap(autoMap);
      setStep('map');
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일을 읽는 중 오류가 발생했습니다');
    }
  };

  const validateAndMapData = () => {
    const mapped: ExcelRow[] = [];
    const validationErrors: string[] = [];

    excelData.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and Excel has header row

      const category = columnMap.category ? String(row[columnMap.category] || '').trim() : '';
      const mainItem = columnMap.mainItem ? String(row[columnMap.mainItem] || '').trim() : '';
      const subItem = columnMap.subItem ? String(row[columnMap.subItem] || '').trim() : '';
      const budgetValue = columnMap.currentBudget ? row[columnMap.currentBudget] : 0;

      // Validate required fields
      if (!category) {
        validationErrors.push(`행 ${rowNum}: 분류가 비어있습니다`);
        return;
      }
      if (!mainItem) {
        validationErrors.push(`행 ${rowNum}: 항목이 비어있습니다`);
        return;
      }

      // Parse budget amount
      let currentBudget = 0;
      if (typeof budgetValue === 'number') {
        currentBudget = budgetValue;
      } else if (typeof budgetValue === 'string') {
        // Remove commas and parse
        const cleaned = budgetValue.replace(/,/g, '');
        currentBudget = parseFloat(cleaned);
      }

      if (isNaN(currentBudget) || currentBudget < 0) {
        validationErrors.push(`행 ${rowNum}: 예산 금액이 유효하지 않습니다 (${budgetValue})`);
        return;
      }

      mapped.push({
        category,
        mainItem,
        subItem: subItem || undefined,
        currentBudget,
      });
    });

    setErrors(validationErrors);
    setMappedData(mapped);

    if (validationErrors.length === 0) {
      setStep('preview');
    }
  };

  const handleImport = async () => {
    if (mappedData.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(mappedData);
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setExcelData([]);
    setHeaders([]);
    setColumnMap({ category: '', mainItem: '', subItem: '', currentBudget: '' });
    setMappedData([]);
    setErrors([]);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">📥 엑셀 파일 가져오기</h2>
          <p className="text-sm text-gray-500 mt-1">
            엑셀 파일에서 예산 항목을 일괄 가져옵니다
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div
              className={`flex items-center ${
                step === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step !== 'upload' ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                }`}
              >
                {step !== 'upload' ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm">파일 업로드</span>
            </div>

            <div className="flex-1 h-0.5 mx-4 bg-gray-300" />

            <div
              className={`flex items-center ${
                step === 'map' ? 'text-blue-600 font-semibold' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'preview' || step === 'importing'
                    ? 'bg-green-500 text-white'
                    : step === 'map'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                {step === 'preview' || step === 'importing' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm">열 매핑</span>
            </div>

            <div className="flex-1 h-0.5 mx-4 bg-gray-300" />

            <div
              className={`flex items-center ${
                step === 'preview' ? 'text-blue-600 font-semibold' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'preview'
                    ? 'bg-blue-100 text-blue-600'
                    : step === 'importing'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {step === 'importing' ? '✓' : '3'}
              </div>
              <span className="ml-2 text-sm">미리보기</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">엑셀 파일 선택</h3>
              <p className="text-sm text-gray-500 mb-6">
                .xlsx 또는 .xls 파일을 선택하세요
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={downloadTemplate}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  📥 양식 다운로드
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  파일 선택
                </button>
              </div>
              <div className="mt-8 max-w-md mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 엑셀 파일 형식 안내
                  </h4>
                  <p className="text-xs text-blue-800 mb-2">다음 열을 포함해야 합니다:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>분류</strong> (예: 공사비, 설계비)</li>
                    <li>• <strong>항목</strong> (예: 토목공사, 건축공사)</li>
                    <li>• 소항목 (선택사항)</li>
                    <li>• <strong>예산금액</strong> (숫자)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">열 매핑 설정</h3>
              <p className="text-sm text-gray-600 mb-6">
                엑셀 파일의 열과 시스템 필드를 매핑하세요 (자동 감지됨)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    분류 (필수) *
                  </label>
                  <select
                    value={columnMap.category}
                    onChange={(e) => setColumnMap({ ...columnMap, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    항목 (필수) *
                  </label>
                  <select
                    value={columnMap.mainItem}
                    onChange={(e) => setColumnMap({ ...columnMap, mainItem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    소항목 (선택)
                  </label>
                  <select
                    value={columnMap.subItem}
                    onChange={(e) => setColumnMap({ ...columnMap, subItem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택 안함</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예산금액 (필수) *
                  </label>
                  <select
                    value={columnMap.currentBudget}
                    onChange={(e) =>
                      setColumnMap({ ...columnMap, currentBudget: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">검증 오류</h4>
                  <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">데이터 미리보기 (처음 3행)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">분류</th>
                        <th className="px-3 py-2 text-left">항목</th>
                        <th className="px-3 py-2 text-left">소항목</th>
                        <th className="px-3 py-2 text-right">예산금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {excelData.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            {columnMap.category ? row[columnMap.category] : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {columnMap.mainItem ? row[columnMap.mainItem] : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {columnMap.subItem ? row[columnMap.subItem] : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {columnMap.currentBudget ? row[columnMap.currentBudget] : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">가져오기 미리보기</h3>
                <p className="text-sm text-gray-600 mt-1">
                  총 <strong className="text-blue-600">{mappedData.length}개</strong> 항목이
                  가져와집니다
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        분류
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        항목
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        소항목
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        예산금액
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mappedData.slice(0, 50).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.mainItem}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.subItem || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                          {item.currentBudget.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {mappedData.length > 50 && (
                <p className="text-xs text-gray-500 mt-2">
                  ... 외 {mappedData.length - 50}개 항목
                </p>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">가져오는 중...</h3>
              <p className="text-sm text-gray-500 mt-2">
                {mappedData.length}개 항목을 가져오고 있습니다
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            {step === 'map' && (
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                ← 이전
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('map')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                ← 이전
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>

            {step === 'map' && (
              <button
                onClick={validateAndMapData}
                disabled={!columnMap.category || !columnMap.mainItem || !columnMap.currentBudget}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 →
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={isImporting || mappedData.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? '가져오는 중...' : `${mappedData.length}개 항목 가져오기`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
