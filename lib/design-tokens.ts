/**
 * DESIGN SYSTEM - TOKENS CENTRALIZADOS
 * 
 * Este arquivo centraliza todos os padrões visuais do sistema.
 * Use estes tokens para garantir consistência em todo o projeto.
 */

// ==================== ESPAÇAMENTOS ====================
export const spacing = {
  // Container e padding geral
  containerPadding: 'px-4 sm:px-6 lg:px-8',
  containerMaxWidth: 'max-w-7xl mx-auto',
  
  // Espaçamentos verticais entre seções
  sectionGap: 'space-y-6 lg:space-y-8',
  cardGap: 'space-y-4 md:space-y-6',
  elementGap: 'space-y-3 md:space-y-4',
  compactGap: 'space-y-2 md:space-y-3',
  
  // Grids responsivos
  grid: {
    cols1: 'grid grid-cols-1 gap-4 md:gap-6',
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
  },
  
  // Flex layouts
  flex: {
    row: 'flex items-center gap-2 md:gap-3',
    rowWrap: 'flex items-center flex-wrap gap-2 md:gap-3',
    col: 'flex flex-col gap-3 md:gap-4',
    between: 'flex items-center justify-between gap-4',
  },
} as const;

// ==================== TIPOGRAFIA ====================
export const typography = {
  // Títulos de página
  pageTitle: 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-white',
  pageSubtitle: 'text-sm md:text-base text-gray-600 dark:text-gray-400',
  
  // Títulos de seção
  sectionTitle: 'text-xl md:text-2xl font-semibold text-gray-900 dark:text-white',
  sectionSubtitle: 'text-sm text-gray-600 dark:text-gray-400',
  
  // Títulos de card
  cardTitle: 'text-lg md:text-xl font-semibold text-gray-900 dark:text-white',
  cardSubtitle: 'text-sm text-gray-600 dark:text-gray-400',
  
  // Corpo de texto
  body: 'text-sm md:text-base text-gray-700 dark:text-gray-300',
  bodySmall: 'text-xs md:text-sm text-gray-600 dark:text-gray-400',
  bodyBold: 'text-sm md:text-base font-semibold text-gray-900 dark:text-white',
  
  // Labels e hints
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  hint: 'text-xs text-gray-500 dark:text-gray-400',
  error: 'text-xs text-red-600 dark:text-red-400',
  
  // Valores monetários
  price: 'text-base md:text-lg font-bold text-gray-900 dark:text-white',
  priceLarge: 'text-xl md:text-2xl font-bold text-gray-900 dark:text-white',
} as const;

// ==================== CORES ====================
export const colors = {
  // Status badges
  badge: {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
  },
  
  // Backgrounds
  background: {
    page: 'bg-gray-50 dark:bg-gray-900',
    card: 'bg-white dark:bg-gray-800',
    elevated: 'bg-white dark:bg-gray-800',
    muted: 'bg-gray-50 dark:bg-gray-700',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
  },
  
  // Borders
  border: {
    default: 'border border-gray-200 dark:border-gray-700',
    strong: 'border-2 border-gray-300 dark:border-gray-600',
    focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
  },
} as const;

// ==================== COMPONENTES ====================
export const components = {
  // Cards
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    padding: 'p-4 md:p-6',
    header: 'border-b border-gray-200 dark:border-gray-700 pb-4 mb-4',
  },
  
  // Botões
  button: {
    base: 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm hover:shadow-md active:scale-[0.98]',
    sizes: {
      xs: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
      sm: 'px-3 py-2 text-sm gap-2 min-h-[36px]',
      md: 'px-4 py-2.5 text-sm md:text-base gap-2 min-h-[40px] md:min-h-[44px]',
      lg: 'px-6 py-3 text-base gap-2.5 min-h-[44px] md:min-h-[48px]',
    },
  },
  
  // Inputs
  input: {
    base: 'w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors min-h-[40px] md:min-h-[44px]',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  },
  
  // Tabelas
  table: {
    wrapper: 'overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700',
    base: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    header: 'bg-gray-50 dark:bg-gray-700',
    headerCell: 'px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
    row: 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
    cell: 'px-4 md:px-6 py-4 text-sm text-gray-900 dark:text-gray-300',
  },
  
  // Modais
  modal: {
    overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4',
    content: 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700',
    header: 'px-6 py-5 border-b border-gray-200 dark:border-gray-700',
    body: 'px-6 py-6 overflow-y-auto',
    footer: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
  },
  
  // Badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  },
  
  // Empty States
  emptyState: {
    container: 'flex flex-col items-center justify-center py-12 md:py-16 px-4',
    icon: 'w-16 h-16 md:w-20 md:h-20 text-gray-400 dark:text-gray-600 mb-4',
    title: 'text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2',
    description: 'text-sm md:text-base text-gray-600 dark:text-gray-400 text-center max-w-sm',
  },
} as const;

// ==================== UTILITÁRIOS ====================
export const utilities = {
  // Transições
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },
  
  // Animações
  animation: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    scaleIn: 'animate-scale-in',
  },
  
  // Touch targets (mínimo 44px para mobile)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Scrollbar customizada
  scrollbar: 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent',
  
  // Truncate
  truncate: {
    single: 'truncate',
    twoLines: 'line-clamp-2',
    threeLines: 'line-clamp-3',
  },
} as const;

// ==================== BREAKPOINTS ====================
export const breakpoints = {
  xs: '475px',  // Celulares pequenos
  sm: '640px',  // Celulares grandes
  md: '768px',  // Tablets
  lg: '1024px', // Laptops
  xl: '1280px', // Desktops
  '2xl': '1536px', // Telas grandes
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Combina classes CSS de forma segura, removendo duplicatas e undefined
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Retorna classes para containers responsivos
 */
export function container(withPadding = true): string {
  return cn(
    spacing.containerMaxWidth,
    withPadding && spacing.containerPadding
  );
}

/**
 * Retorna classes para page wrapper completo
 */
export function pageWrapper(): string {
  return cn(
    'min-h-screen',
    colors.background.page,
    spacing.containerPadding,
    'py-6 lg:py-8'
  );
}
