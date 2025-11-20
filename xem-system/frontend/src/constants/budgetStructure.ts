/**
 * 표준 예산 항목 구조
 * 이미지 기반 예산 분류 체계
 */

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetMainItem[];
}

export interface BudgetMainItem {
  id: string;
  name: string;
  subItems: string[];
}

/**
 * 지출 예산 구조
 */
export const EXPENSE_BUDGET_STRUCTURE: BudgetCategory[] = [
  {
    id: 'land',
    name: '토지비',
    items: [
      { id: 'land-1', name: '토지매입비', subItems: ['수요권리전등기비', '토지보유세(재산세등)'] },
    ],
  },
  {
    id: 'construction',
    name: '공사비',
    items: [
      { id: 'const-1', name: '도급공사비', subItems: [] },
      { id: 'const-2', name: '실행공사비', subItems: [] },
      { id: 'const-3', name: '인입공사비', subItems: [] },
    ],
  },
  {
    id: 'usage',
    name: '용역비',
    items: [
      { id: 'usage-1', name: '건축설계비', subItems: [] },
      { id: 'usage-2', name: '건축감리비', subItems: [] },
      { id: 'usage-3', name: '미술작품비(주거)', subItems: [] },
      { id: 'usage-4', name: '기타용역비', subItems: [] },
    ],
  },
  {
    id: 'subsidy',
    name: '부담금',
    items: [
      { id: 'subsidy-1', name: '학교용지부담금', subItems: [] },
      { id: 'subsidy-2', name: '지역난방시설부담금', subItems: [] },
      { id: 'subsidy-3', name: '상하수도원인자부담금', subItems: [] },
      { id: 'subsidy-4', name: '기타부담금', subItems: [] },
    ],
  },
  {
    id: 'sales',
    name: '판매비',
    items: [
      { id: 'sales-1', name: '분양광고홍보비', subItems: [] },
      { id: 'sales-2', name: 'M/H 부지임대료', subItems: [] },
      { id: 'sales-3', name: 'M/H 건립비', subItems: [] },
      { id: 'sales-4', name: 'M/H 운영비', subItems: [] },
      { id: 'sales-5', name: '분양대행수수료(주거)', subItems: [] },
      { id: 'sales-6', name: '분양대행수수료(상가)', subItems: [] },
      { id: 'sales-7', name: '분양보증수수료', subItems: [] },
      { id: 'sales-8', name: '입주관리용역비', subItems: [] },
    ],
  },
  {
    id: 'other',
    name: '기타비',
    items: [
      { id: 'other-1', name: '보존등기비', subItems: [] },
      { id: 'other-2', name: '신탁수수료(관리형)', subItems: [] },
      { id: 'other-3', name: '시행상일반관리비', subItems: [] },
      { id: 'other-4', name: '예비비', subItems: [] },
      { id: 'other-5', name: '매입세불공제액', subItems: [] },
    ],
  },
  {
    id: 'finance',
    name: '금융비용',
    items: [
      { id: 'finance-1', name: 'Equity 기회비용', subItems: [] },
      { id: 'finance-2', name: '금융자문수수료', subItems: [] },
      { id: 'finance-3', name: 'B/L 취급수수료(Equity 조달)', subItems: [] },
      { id: 'finance-4', name: 'B/L 이자 (Equity 조달)', subItems: [] },
      { id: 'finance-5', name: 'P/F 보증수수료', subItems: [] },
      { id: 'finance-6', name: 'P/F 취급수수료', subItems: [] },
      { id: 'finance-7', name: 'P/F 이자(Tr-A)', subItems: [] },
      { id: 'finance-8', name: '중도금 보증수수료', subItems: [] },
      { id: 'finance-9', name: '중도금 후불이자', subItems: [] },
    ],
  },
];

/**
 * 카테고리별 색상 (E-iNK 스타일)
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  land: { bg: 'bg-stone-50', text: 'text-stone-900', border: 'border-stone-200' },
  construction: { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200' },
  usage: { bg: 'bg-zinc-50', text: 'text-zinc-900', border: 'border-zinc-200' },
  subsidy: { bg: 'bg-neutral-50', text: 'text-neutral-900', border: 'border-neutral-200' },
  sales: { bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
  other: { bg: 'bg-stone-50', text: 'text-stone-900', border: 'border-stone-200' },
  finance: { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200' },
};

/**
 * 주어진 카테고리 이름으로 구조 찾기
 */
export function findCategoryStructure(categoryName: string): BudgetCategory | undefined {
  return EXPENSE_BUDGET_STRUCTURE.find((cat) => cat.name === categoryName);
}

/**
 * 카테고리의 모든 main items 가져오기
 */
export function getMainItems(categoryName: string): string[] {
  const category = findCategoryStructure(categoryName);
  return category ? category.items.map((item) => item.name) : [];
}

/**
 * 특정 main item의 sub items 가져오기
 */
export function getSubItems(categoryName: string, mainItemName: string): string[] {
  const category = findCategoryStructure(categoryName);
  if (!category) return [];

  const mainItem = category.items.find((item) => item.name === mainItemName);
  return mainItem ? mainItem.subItems : [];
}
