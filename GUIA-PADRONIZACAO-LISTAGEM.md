# 📋 GUIA DE PADRONIZAÇÃO - PÁGINAS DE LISTAGEM

## 🎯 Objetivo
Padronizar TODAS as páginas de listagem (index pages) com o design system global.

---

## 📐 ESTRUTURA PADRÃO

### 1. Container Principal
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
    {/* Content */}
  </div>
</div>
```

### 2. Header com Título e Botão de Ação
```tsx
<div className="mb-6 lg:mb-8">
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[color]-500 to-[color]-600 flex items-center justify-center shadow-lg">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Título da Página
        </h1>
      </div>
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
        Descrição da página
      </p>
    </div>
    
    <Link href="/admin/modulo/novo">
      <Button size="lg" className="w-full sm:w-auto min-h-[44px]">
        <Plus className="w-5 h-5 mr-2" />
        Novo Item
      </Button>
    </Link>
  </div>
</div>
```

### 3. Barra de Busca
```tsx
<div className="mb-6">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
    <input
      type="text"
      placeholder="Buscar..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
    />
  </div>
</div>
```

### 4. Tabela Responsiva
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
  {/* Desktop Table */}
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Coluna
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
            Dado
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  {/* Mobile Cards */}
  <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Card content */}
    </div>
  </div>
</div>
```

### 5. Botões de Ação na Tabela
```tsx
<div className="flex items-center gap-2">
  <Link href={`/admin/modulo/${id}`}>
    <Button variant="outline" size="sm" className="min-h-[36px]">
      <Eye className="w-4 h-4" />
    </Button>
  </Link>
  <Link href={`/admin/modulo/${id}/editar`}>
    <Button variant="outline" size="sm" className="min-h-[36px]">
      <Pencil className="w-4 h-4" />
    </Button>
  </Link>
  <Button 
    variant="danger" 
    size="sm" 
    onClick={() => handleDelete(id)}
    className="min-h-[36px]"
  >
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

### 6. Estados Vazios e Erros
```tsx
{isLoading && <SkeletonTable />}
{isError && <ErrorState message={error?.message} />}
{!isLoading && !isError && filteredItems.length === 0 && (
  <NoResults 
    message="Nenhum item encontrado" 
    description="Tente ajustar sua busca ou adicionar um novo item"
  />
)}
```

---

## 🎨 CORES DE ÍCONES POR MÓDULO

```tsx
// Clientes
from-green-500 to-green-600 (Users)

// Profissionais
from-orange-500 to-orange-600 (UserPlus)

// Serviços
from-purple-500 to-purple-600 (Scissors)

// Produtos
from-blue-500 to-blue-600 (Package)

// Agendamentos
from-indigo-500 to-indigo-600 (Calendar)

// Despesas
from-red-500 to-red-600 (Receipt)

// Vendas
from-emerald-500 to-emerald-600 (ShoppingCart)

// PDV
from-cyan-500 to-cyan-600 (CreditCard)

// Dashboard
from-violet-500 to-violet-600 (LayoutDashboard)

// Relatórios
from-pink-500 to-pink-600 (BarChart)
```

---

## 📱 RESPONSIVIDADE OBRIGATÓRIA

### Breakpoints
- **Mobile**: até 640px (sm)
  - Cards verticais
  - Botões full-width
  - Stack vertical
  
- **Tablet**: 641px - 1024px (md, lg)
  - Grid de 2 colunas
  - Tabela simplificada ou cards
  
- **Desktop**: 1025px+ (lg, xl)
  - Tabela completa
  - Grid de 3-4 colunas
  - Layout horizontal

### Touch Targets
- Mínimo 44px de altura para botões e campos
- Espaçamento adequado entre elementos clicáveis

---

## ✅ CHECKLIST DE PADRONIZAÇÃO

- [ ] Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8`
- [ ] Header com ícone gradiente específico do módulo
- [ ] Título: `text-2xl md:text-3xl font-bold`
- [ ] Descrição: `text-sm md:text-base text-gray-600`
- [ ] Botão "Novo": min-h-[44px], ícone Plus
- [ ] Campo de busca: min-h-[44px], ícone Search
- [ ] Tabela responsiva: Desktop (table) + Mobile (cards)
- [ ] Hover states em linhas/cards
- [ ] Botões de ação: Eye, Pencil, Trash2 com min-h-[36px]
- [ ] Estados: Loading (SkeletonTable), Error (ErrorState), Empty (NoResults)
- [ ] Dark mode em todos os elementos
- [ ] Transições suaves (transition-colors, duration-200)

---

## 🚫 PROIBIÇÕES

❌ Não usar `container-app` (substituir por container padrão)  
❌ Não usar `spacing-section` ou `spacing-card` (usar mb-6 lg:mb-8)  
❌ Não usar classes antigas de botão (`btn-primary`, etc)  
❌ Não usar `text-3xl` sem `md:text-3xl` responsivo  
❌ Não criar estilos inline ou classes personalizadas  
❌ Não usar altura fixa em elementos sem min-h  

---

## 📄 PÁGINAS A PADRONIZAR

### Principais (10 páginas)
1. [ ] `/admin/dashboard` - Dashboard
2. [ ] `/admin/clientes` - Listagem de clientes
3. [ ] `/admin/profissionais` - Listagem de profissionais
4. [ ] `/admin/servicos` - Listagem de serviços
5. [ ] `/admin/produtos` - Listagem de produtos
6. [ ] `/admin/agendamentos` - Listagem de agendamentos
7. [ ] `/admin/despesas` - Listagem de despesas
8. [ ] `/admin/vendas` - Listagem de vendas
9. [ ] `/admin/pdv` - Ponto de venda
10. [ ] `/admin/relatorios` - Relatórios

---

**Última atualização:** 04/12/2025
