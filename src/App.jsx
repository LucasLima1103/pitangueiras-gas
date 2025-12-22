import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  Minus, 
  Trash2, 
  Flame, 
  Droplets, 
  Search,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Save,
  X,
  RotateCcw,
  Timer,
  Lock, 
  User, 
  LogOut, 
  ArrowRight,
  Truck, 
  MapPin, 
  CheckCircle, 
  ClipboardList,
  FileText, 
  Download, 
  RefreshCw,
  ShoppingBag,
  ChevronLeft,
  Users, 
  Calendar, 
  CreditCard 
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query 
} from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDrtW-74hc7MrzvTO6EoagpexE6tSVRrYo",
  authDomain: "pitangueiras-gas-app.firebaseapp.com",
  projectId: "pitangueiras-gas-app",
  storageBucket: "pitangueiras-gas-app.firebasestorage.app",
  messagingSenderId: "1031325898176",
  appId: "1:1031325898176:web:acd77e3c987299230ca425"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Definimos um ID fixo para o seu app não misturar dados
const appId = 'pitangueiras-gas-app';


// --- HELPERS E COMPONENTES AUXILIARES ---

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getRemainingTime = (dateString) => {
  if (!dateString) return "-";
  const deletionDate = new Date(dateString);
  const expirationDate = new Date(deletionDate.getTime() + (72 * 60 * 60 * 1000));
  const now = new Date();
  const diffTime = expirationDate - now;
  
  if (diffTime <= 0) return "Expirado";
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h`;
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border border-gray-300 text-gray-600 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100"
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- COMPONENTES DE VISUALIZAÇÃO ---

const CustomersView = ({ customers, appId, userId }) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', cpf: '', address: '' });
  
  // Estado para nova venda a prazo
  const [newDebt, setNewDebt] = useState({ purchaseDate: '', dueDate: '', amount: '', description: '' });

  // Referência para coleção de clientes
  const customersRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address) return alert("Nome e endereço são obrigatórios");
    try {
      await addDoc(customersRef, {
        ...newCustomer,
        debts: []
      });
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', cpf: '', address: '' });
    } catch (e) {
      console.error("Erro ao adicionar cliente", e);
      alert("Erro ao salvar cliente.");
    }
  };

  const handleAddDebt = async () => {
    if (!newDebt.amount || !newDebt.dueDate || !newDebt.purchaseDate) return alert("Preencha os dados da venda");
    if (!selectedCustomer) return;

    const debt = { 
      id: Date.now(), // ID local para o item do array
      ...newDebt, 
      amount: parseFloat(newDebt.amount), 
      paid: false 
    };

    const customerRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id);
    const updatedDebts = [debt, ...(selectedCustomer.debts || [])];

    try {
      await updateDoc(customerRef, { debts: updatedDebts });
      setNewDebt({ purchaseDate: '', dueDate: '', amount: '', description: '' });
    } catch (e) {
      console.error("Erro ao adicionar dívida", e);
    }
  };

  const toggleDebtStatus = async (debtId) => {
    if (!selectedCustomer) return;
    const customerRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id);
    
    const updatedDebts = selectedCustomer.debts.map(d => 
      d.id === debtId ? { ...d, paid: !d.paid } : d
    );

    try {
      await updateDoc(customerRef, { debts: updatedDebts });
    } catch (e) {
      console.error("Erro ao atualizar dívida", e);
    }
  };

  // Mantém o cliente selecionado atualizado com os dados do banco
  const activeCustomerData = selectedCustomer ? customers.find(c => c.id === selectedCustomer.id) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Clientes e Crediário
        </h2>
        <Button onClick={() => setIsCustomerModalOpen(true)} variant="primary">
          <Plus size={18} /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
              Lista de Clientes
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {customers.map(customer => {
                const totalDebt = (customer.debts || []).filter(d => !d.paid).reduce((acc, d) => acc + d.amount, 0);
                return (
                  <div 
                    key={customer.id} 
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${activeCustomerData?.id === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-800">{customer.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{customer.address}</p>
                      </div>
                      {totalDebt > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                          -{formatCurrency(totalDebt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detalhes do Cliente e Vendas a Prazo */}
        <div className="lg:col-span-2">
          {activeCustomerData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{activeCustomerData.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><User size={14}/> {activeCustomerData.cpf || 'CPF não inf.'}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {activeCustomerData.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total em Aberto</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency((activeCustomerData.debts || []).filter(d => !d.paid).reduce((acc, d) => acc + d.amount, 0))}
                  </p>
                </div>
              </div>

              {/* Formulário de Nova Venda a Prazo */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                  <CreditCard size={16}/> Lançar Venda a Prazo (Fiado)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date" 
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={newDebt.purchaseDate}
                    onChange={e => setNewDebt({...newDebt, purchaseDate: e.target.value})}
                    title="Data da Compra"
                  />
                  <input 
                    type="date" 
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={newDebt.dueDate}
                    onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})}
                    title="Data de Vencimento"
                  />
                  <input 
                    type="text" 
                    placeholder="Descrição (ex: 2x Água)"
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={newDebt.description}
                    onChange={e => setNewDebt({...newDebt, description: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Valor R$"
                      className="border border-gray-300 rounded p-2 text-sm w-full"
                      value={newDebt.amount}
                      onChange={e => setNewDebt({...newDebt, amount: e.target.value})}
                    />
                    <button 
                      onClick={handleAddDebt}
                      className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Vendas/Dívidas */}
              <div className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="p-3">Data Compra</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!activeCustomerData.debts || activeCustomerData.debts.length === 0) ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td>
                      </tr>
                    ) : (
                      activeCustomerData.debts.map(debt => (
                        <tr key={debt.id} className={debt.paid ? 'opacity-50 bg-gray-50' : ''}>
                          <td className="p-3">{new Date(debt.purchaseDate).toLocaleDateString()}</td>
                          <td className="p-3">{debt.description}</td>
                          <td className="p-3 text-red-600 font-medium">{new Date(debt.dueDate).toLocaleDateString()}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(debt.amount)}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => toggleDebtStatus(debt.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                debt.paid 
                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-green-100 hover:text-green-700 hover:border-green-200'
                              }`}
                            >
                              {debt.paid ? 'PAGO' : 'PENDENTE'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 border-dashed p-12 text-gray-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Selecione um cliente para ver os detalhes e gerenciar o fiado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Novo Cliente</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="000.000.000-00"
                  value={newCustomer.cpf}
                  onChange={(e) => setNewCustomer({...newCustomer, cpf: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsCustomerModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={handleAddCustomer} className="flex-1 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ sales, products }) => {
  const today = new Date().toLocaleDateString();
  const salesToday = sales.filter(s => new Date(s.date).toLocaleDateString() === today);
  const revenueToday = salesToday.reduce((acc, s) => acc + s.total, 0);
  const lowStockItems = products.filter(p => p.stock < 15);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-full text-white">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Faturamento Hoje</p>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(revenueToday)}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-full text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Vendas Totais</p>
              <h3 className="text-2xl font-bold text-gray-800">{sales.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-full text-white">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Produtos Baixo Estoque</p>
              <h3 className="text-2xl font-bold text-gray-800">{lowStockItems.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History size={20} className="text-blue-600"/> Últimas Vendas
          </h3>
          <div className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sem vendas recentes</td></tr>
                ) : (
                  sales.slice(0, 5).map(sale => (
                    <tr key={sale.id}>
                      <td className="p-3">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-3 font-medium">{formatCurrency(sale.total)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${sale.type === 'entrega' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {sale.type === 'entrega' ? 'Entrega' : 'Balcão'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500"/> Alertas de Estoque
          </h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Estoque normal</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    {item.category === 'gas' ? <Flame size={18} className="text-red-500" /> : <Droplets size={18} className="text-blue-500" />}
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-red-600">{item.stock} un.</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const POSView = ({ products, addToCart, cart, updateCartQuantity, removeFromCart, cartTotal, finalizeSale }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [clientName, setClientName] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6 animate-in slide-in-from-right duration-300">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            className="flex-1 outline-none text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-left transition-all hover:shadow-md hover:border-red-300 flex flex-col gap-2 group ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between items-start w-full">
                <div className={`p-2 rounded-lg ${product.category === 'gas' ? 'bg-red-100 text-red-600' : product.category === 'water' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  {product.category === 'gas' ? <Flame size={20} /> : product.category === 'water' ? <Droplets size={20} /> : <Package size={20} />}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  Est: {product.stock}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 leading-tight group-hover:text-red-600">{product.name}</h4>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full md:w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={20} /> Carrinho Atual
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ShoppingCart size={48} className="mb-2" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)} un.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200">
                    <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 text-gray-600"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 text-gray-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="flex justify-between items-center text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          {paymentModalOpen ? (
            <div className="space-y-3 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Tipo de Pedido:</span>
                <div className="flex gap-2">
                    <button 
                    onClick={() => setIsDelivery(false)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${!isDelivery ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Balcão
                    </button>
                    <button 
                    onClick={() => setIsDelivery(true)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${isDelivery ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Entrega
                    </button>
                </div>
              </div>

              {isDelivery && (
                <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <input 
                    type="text" 
                    placeholder="Nome do Cliente"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-red-500 outline-none"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Endereço de Entrega"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-red-500 outline-none"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              <p className="text-sm text-gray-600 text-center mb-2">Selecione o pagamento:</p>
              <div className="grid grid-cols-2 gap-2">
                {['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'].map(method => (
                  <button
                    key={method}
                    disabled={isDelivery && (!deliveryAddress || !clientName)}
                    onClick={() => {
                      finalizeSale(method, isDelivery, { address: deliveryAddress, client: clientName });
                      setPaymentModalOpen(false);
                      setIsDelivery(false);
                      setDeliveryAddress("");
                      setClientName("");
                    }}
                    className="p-2 bg-white border border-gray-200 rounded text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {method}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="w-full text-center text-sm text-red-500 mt-2 hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <Button 
              variant="success" 
              className="w-full py-3 text-lg" 
              disabled={cart.length === 0}
              onClick={() => setPaymentModalOpen(true)}
            >
              {isDelivery ? 'Agendar Entrega' : 'Finalizar Venda'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ 
  showTrash, setShowTrash, activeTrash, products, updateStock, updatePrice, 
  moveToTrash, restoreFromTrash, deletePermanently, setDeleteConfirmationId, 
  isModalOpen, setIsModalOpen, newProduct, setNewProduct, handleAddProduct,
  deleteConfirmationId, executeMoveToTrash
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {showTrash ? 'Lixeira (Itens Excluídos)' : 'Controle de Estoque'}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant={showTrash ? 'primary' : 'outline'}
            onClick={() => setShowTrash(!showTrash)}
            className={showTrash ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-gray-500 border-gray-300'}
          >
            {showTrash ? <Package size={18} /> : <Trash2 size={18} />}
            {showTrash ? 'Voltar ao Estoque' : `Lixeira (${activeTrash.length})`}
          </Button>
          {!showTrash && (
            <Button 
              variant="primary" 
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} /> Novo Produto
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              {showTrash ? (
                <>
                  <th className="p-4 font-medium text-center">Excluído em</th>
                  <th className="p-4 font-medium text-center">Expira em</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </>
              ) : (
                <>
                  <th className="p-4 font-medium text-center">Estoque Atual</th>
                  <th className="p-4 font-medium text-right">Preço (R$)</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {showTrash ? (
              activeTrash.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">A lixeira está vazia.</td>
                </tr>
              ) : (
                activeTrash.map(product => (
                  <tr key={product.id} className="hover:bg-red-50 bg-red-50/30">
                    <td className="p-4 font-medium text-gray-600 line-through decoration-red-400">{product.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 grayscale">
                        {product.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      {new Date(product.deletedAt).toLocaleDateString()} <span className="text-xs">{new Date(product.deletedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-lg text-sm">
                        <Timer size={14} />
                        {getRemainingTime(product.deletedAt)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => restoreFromTrash(product.id)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-100 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          title="Restaurar item"
                        >
                          <RotateCcw size={16} /> Restaurar
                        </button>
                        <button 
                          onClick={() => deletePermanently(product.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Excluir permanentemente"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{product.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.category === 'gas' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {product.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}
                        className="w-8 h-8 rounded bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="number" 
                        value={product.stock}
                        onChange={(e) => updateStock(product.id, e.target.value)}
                        className="w-16 text-center border border-gray-200 rounded py-1"
                      />
                      <button 
                        onClick={() => updateStock(product.id, product.stock + 1)}
                        className="w-8 h-8 rounded bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <input 
                      type="number" 
                      step="0.10"
                      value={product.price}
                      onChange={(e) => updatePrice(product.id, e.target.value)}
                      className="w-24 text-right border border-gray-200 rounded py-1 px-2 focus:border-red-500 outline-none"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setDeleteConfirmationId(product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="Mover para lixeira"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Novo Produto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                  placeholder="Ex: Água 5L"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500 bg-white"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="gas">Gás</option>
                  <option value="water">Água</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddProduct}
                className="flex-1 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (Lixeira) */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-gray-800">Mover para Lixeira?</h3>
            </div>
            <p className="text-gray-600 text-sm">
              O item será movido para a lixeira e ficará disponível para restauração por 72 horas.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={executeMoveToTrash}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Sim, mover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesHistoryView = ({ sales, userRole }) => {
  const [filterDate, setFilterDate] = useState("");
  
  let baseSales = sales;
  if (userRole === 'entregador') {
    baseSales = sales.filter(s => s.type === 'entrega' && s.status === 'entregue');
  }

  const filteredSales = filterDate 
    ? baseSales.filter(s => s.date.startsWith(filterDate))
    : baseSales;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {userRole === 'entregador' ? 'Minhas Entregas Realizadas' : 'Histórico Completo'}
        </h2>
        <input 
          type="date" 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Data/Hora</th>
              <th className="p-4 font-medium">Detalhes</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
              </tr>
            ) : (
              filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">#{String(sale.id).slice(-6)}</td>
                  <td className="p-4 text-gray-800">
                    {new Date(sale.date).toLocaleDateString()} <span className="text-gray-400 text-sm">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                        {sale.address && (
                        <span className="text-xs text-blue-600 font-bold mb-1 flex items-center gap-1">
                            <MapPin size={12}/> {sale.address}
                        </span>
                      )}
                      {sale.items.map((item, idx) => (
                        <span key={idx} className="text-sm text-gray-600">
                          {item.qtd}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        sale.status === 'pendente' 
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                      {sale.status === 'pendente' ? 'Pendente' : 'Concluído'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(sale.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DeliveriesView = ({ sales, markAsDelivered }) => {
  const pendingDeliveries = sales.filter(s => s.type === 'entrega' && s.status === 'pendente');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Truck className="text-blue-600" /> Entregas Pendentes
      </h2>

      {pendingDeliveries.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-800">Tudo limpo!</h3>
          <p className="text-gray-500">Nenhuma entrega pendente no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDeliveries.map(sale => (
            <Card key={sale.id} className="border-l-4 border-l-red-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Truck size={64} />
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400">PEDIDO #{String(sale.id).slice(-4)}</span>
                  <h3 className="text-lg font-bold text-gray-800 mt-1">{sale.client || "Cliente não informado"}</h3>
                </div>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                  Pendente
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={18} className="mt-1 text-blue-500 shrink-0" />
                  <p className="font-medium text-sm leading-tight">{sale.address}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign size={18} className="text-green-500 shrink-0" />
                  <p className="font-medium text-sm">Valor: <span className="text-gray-900 font-bold">{formatCurrency(sale.total)}</span> ({sale.method})</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Itens</p>
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900">x{item.qtd}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sale.address)}`, '_blank')}
                  className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  <MapPin size={18} /> Rota
                </Button>
                <Button 
                  onClick={() => markAsDelivered(sale.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={18} /> Confirmar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const FiscalView = ({ invoices, setInvoices, sales, setFiscalModalOpen, fiscalModalOpen, selectedSaleForInvoice, setSelectedSaleForInvoice, documentInput, setDocumentInput, handleEmitInvoice, isTransmitting, appId }) => {
  const invoicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invoices');

  const onEmit = async () => {
    if (!documentInput) return alert("CPF/CNPJ obrigatório");
    
    // Simulação local de sucesso, mas salvando no banco
    const newInvoice = {
      id: Date.now(),
      number: `00${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date().toISOString(),
      recipient: documentInput,
      total: selectedSaleForInvoice ? selectedSaleForInvoice.total : 0,
      status: 'authorized',
      key: `${Math.random().toString(36).substr(2, 9)}...`
    };

    try {
      await addDoc(invoicesRef, newInvoice);
      handleEmitInvoice(); // Callback to clear local state
    } catch(e) {
      console.error("Erro ao emitir nota", e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Emissão de Notas Fiscais
        </h2>
        <Button onClick={() => setFiscalModalOpen(true)} variant="primary">
          <Plus size={18} /> Nova Nota Fiscal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-full text-white">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Autorizadas</p>
                <h3 className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.status === 'authorized').length}</h3>
              </div>
            </div>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-full text-white">
                <RefreshCw size={24} />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Processando</p>
                <h3 className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.status === 'processing').length}</h3>
              </div>
            </div>
        </Card>
        <Card className="bg-red-50 border-red-100">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-full text-white">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Canceladas/Erro</p>
                <h3 className="text-2xl font-bold text-gray-800">0</h3>
              </div>
            </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Histórico de Emissões</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium">Número</th>
              <th className="p-4 font-medium">Emissão</th>
              <th className="p-4 font-medium">Destinatário</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Valor</th>
              <th className="p-4 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-700">#{invoice.number}</td>
                <td className="p-4 text-gray-600">
                  {new Date(invoice.date).toLocaleDateString()} <span className="text-xs">{new Date(invoice.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td className="p-4 text-gray-800 font-medium">{invoice.recipient}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                    invoice.status === 'authorized' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {invoice.status === 'authorized' ? <CheckCircle size={12}/> : <RefreshCw size={12}/>}
                    {invoice.status === 'authorized' ? 'Autorizada' : 'Processando'}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(invoice.total)}</td>
                <td className="p-4 text-center">
                   <button 
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Baixar DANFE/XML"
                   >
                     <Download size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Emissão de Nota */}
      {fiscalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[500px] space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-600"/> Emitir Nota Fiscal (Simulação)
              </h3>
              <button onClick={() => setFiscalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p>Esta é uma simulação. Em um ambiente real, os dados seriam assinados digitalmente e enviados para a API da SEFAZ.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecione uma Venda (Opcional)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                  onChange={(e) => {
                    const sale = sales.find(s => s.id === e.target.value); // IDs agora são strings do Firestore
                    if(sale) {
                      setSelectedSaleForInvoice(sale);
                      setDocumentInput(sale.client || '');
                    } else {
                      setSelectedSaleForInvoice(null);
                      setDocumentInput('');
                    }
                  }}
                >
                  <option value="">-- Selecione --</option>
                  {sales.map(s => (
                    <option key={s.id} value={s.id}>Venda #{String(s.id).slice(-4)} - {formatCurrency(s.total)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário (CPF/CNPJ ou Nome)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="000.000.000-00"
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                />
              </div>

              {selectedSaleForInvoice && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Resumo da Nota</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Itens:</span>
                    <span className="font-medium">{selectedSaleForInvoice.items.length} produtos</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900">
                    <span>Valor Total:</span>
                    <span>{formatCurrency(selectedSaleForInvoice.total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setFiscalModalOpen(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button 
                onClick={onEmit}
                disabled={isTransmitting}
                className="flex-1 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-blue-400"
              >
                {isTransmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Transmitindo...
                  </>
                ) : (
                  <>Transmitir para SEFAZ</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE LOGIN ---
const LoginScreen = ({ onLogin, onCustomerEnter }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      onLogin('admin');
    } else if (username === 'entregador' && password === '1234') {
      onLogin('entregador');
    } else {
      setError('Usuário ou senha inválidos');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-red-700 to-blue-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pitangueiras Gás e Água</h1>
          <p className="text-white/90 text-sm mt-2">Sistema de Gestão para Distribuidoras</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="admin ou entregador"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg group bg-red-600 hover:bg-red-700">
              Entrar no Sistema
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button onClick={onCustomerEnter} variant="outline" className="w-full py-3 border-blue-500 text-blue-600 hover:bg-blue-50 group">
              <ShoppingBag size={18} className="mr-2" /> Sou Cliente - Fazer Pedido
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Admin: <strong>admin</strong> / <strong>1234</strong></p>
            <p>Entregador: <strong>entregador</strong> / <strong>1234</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APLICAÇÃO PRINCIPAL ---

export default function App() {
  const [viewMode, setViewMode] = useState('login'); // 'login', 'admin', 'customer'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // -- ESTADOS (agora carregados do Firebase) --
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [user, setUser] = useState(null);

  const [cart, setCart] = useState([]);
  const [trash, setTrash] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'water', price: '', stock: '' });
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);
  const [fiscalModalOpen, setFiscalModalOpen] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);
  const [documentInput, setDocumentInput] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);

  // --- FIREBASE: AUTH & DATA SYNC ---
  useEffect(() => {
    // 1. Inicializar Auth
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 2. Sincronizar Coleções em Tempo Real
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const salesRef = collection(db, 'artifacts', appId, 'public', 'data', 'sales');
    const customersRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
    const invoicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invoices');

    const unsubProducts = onSnapshot(productsRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const active = data.filter(p => !p.deletedAt);
      const deleted = data.filter(p => p.deletedAt);
      setProducts(active);
      setTrash(deleted);
    }, (err) => console.error("Err products", err));

    const unsubSales = onSnapshot(salesRef, (snap) => {
      // Ordenar por data (mais recente primeiro)
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setSales(data);
    });

    const unsubCustomers = onSnapshot(customersRef, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInvoices = onSnapshot(invoicesRef, (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubInvoices();
    };
  }, [user]);

  // -- Login Handler --
  const handleLogin = (role) => {
    // Login visual (Mock)
    setIsAuthenticated(true);
    setUserRole(role);
    setViewMode('admin'); 
    setActiveTab(role === 'admin' ? 'dashboard' : 'deliveries');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('admin');
    setViewMode('login');
    setActiveTab('dashboard');
  };

  // -- Handler para Pedido do Cliente --
  const handleCustomerOrder = async (orderData) => {
    if (!user) return;
    
    // 1. Criar Venda
    const newSale = {
      date: new Date().toISOString(),
      total: orderData.total,
      items: orderData.cart.map(i => ({ name: i.name, qtd: i.quantity })),
      method: orderData.customer.payment,
      type: 'entrega',
      status: 'pendente',
      address: orderData.customer.address,
      client: orderData.customer.name
    };
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), newSale);

      // 2. Atualizar Estoque
      for (const item of orderData.cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const productRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id);
          await updateDoc(productRef, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }
      alert("Pedido realizado com sucesso!");
    } catch (e) {
      console.error("Erro no pedido", e);
      alert("Erro ao processar pedido.");
    }
  };

  // -- LOGIC: Actions (Firestore) --

  // Carrinho Local
  const addToCart = (product) => {
    if (product.stock <= 0) return alert("Produto sem estoque!");
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert("Limite de estoque atingido!");
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const updateCartQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const p = products.find(p => p.id === id);
        const newQ = item.quantity + delta;
        if (newQ > p.stock) return item;
        return { ...item, quantity: Math.max(1, newQ) };
      }
      return item;
    }));
  };
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const finalizeSale = async (method, isDelivery = false, deliveryDetails = null) => {
    if (cart.length === 0) return;
    
    const newSale = {
      date: new Date().toISOString(),
      total: cartTotal,
      items: cart.map(i => ({ name: i.name, qtd: i.quantity })),
      method: method,
      type: isDelivery ? 'entrega' : 'balcao',
      status: isDelivery ? 'pendente' : 'entregue',
      address: isDelivery ? deliveryDetails.address : null,
      client: isDelivery ? deliveryDetails.client : null
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), newSale);
      
      // Atualizar Estoque
      for (const item of cart) {
        const productRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', item.id);
        const p = products.find(p => p.id === item.id);
        if (p) await updateDoc(productRef, { stock: p.stock - item.quantity });
      }
      
      setCart([]);
      alert(isDelivery ? "Pedido enviado para entrega!" : "Venda realizada com sucesso!");
    } catch (e) {
      console.error(e);
    }
  };

  const markAsDelivered = async (id) => {
    const saleRef = doc(db, 'artifacts', appId, 'public', 'data', 'sales', id);
    await updateDoc(saleRef, { status: 'entregue' });
    alert("Entrega confirmada!");
  };

  const updateStock = async (id, newStock) => {
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
    await updateDoc(ref, { stock: parseInt(newStock) });
  };

  const updatePrice = async (id, newPrice) => {
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
    await updateDoc(ref, { price: parseFloat(newPrice) });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return alert("Preencha todos os campos.");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        deletedAt: null // Não deletado
      });
      setIsModalOpen(false);
      setNewProduct({ name: '', category: 'water', price: '', stock: '' });
    } catch (e) { console.error(e); }
  };

  const executeMoveToTrash = async () => {
    if (!deleteConfirmationId) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', deleteConfirmationId);
    await updateDoc(ref, { deletedAt: new Date().toISOString() });
    setDeleteConfirmationId(null);
  };

  const restoreFromTrash = async (id) => {
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
    await updateDoc(ref, { deletedAt: null });
  };

  const deletePermanently = async (id) => {
    if(!window.confirm("Isso apagará o item permanentemente.")) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
    await deleteDoc(ref);
  };

  const handleEmitInvoice = () => {
    setFiscalModalOpen(false);
    setDocumentInput("");
    setSelectedSaleForInvoice(null);
    setIsTransmitting(false);
    alert("Nota Fiscal autorizada com sucesso pela SEFAZ (Simulação)!");
  };

  // -- RENDERIZAÇÃO --

  if (viewMode === 'login') {
    return <LoginScreen onLogin={handleLogin} onCustomerEnter={() => setViewMode('customer')} />;
  }

  if (viewMode === 'customer') {
    return <CustomerOrderView products={products} onOrder={handleCustomerOrder} onBack={() => setViewMode('login')} />;
  }

  const menuItems = userRole === 'admin' 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'Vender (PDV)', icon: ShoppingCart },
        { id: 'inventory', label: 'Estoque', icon: Package },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'sales', label: 'Histórico', icon: History },
        { id: 'fiscal', label: 'Notas Fiscais', icon: FileText },
      ]
    : [
        { id: 'deliveries', label: 'Entregas', icon: Truck },
        { id: 'sales', label: 'Histórico', icon: History },
      ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <aside className="w-20 lg:w-64 bg-red-900 text-white flex flex-col transition-all duration-300 flex-shrink-0">
        <div className="p-4 lg:p-6 flex items-center gap-3 justify-center lg:justify-start border-b border-red-800">
          <div className="bg-white/10 p-2 rounded-lg">
            <Flame size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold hidden lg:block tracking-tight leading-tight">Pitangueiras<br/>Gás e Água</span>
        </div>

        <nav className="flex-1 py-6 px-2 lg:px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-red-100 hover:bg-red-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className="min-w-[22px]" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-red-800">
          <div className="bg-red-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-red-200">Usuário Logado</span>
              <button onClick={handleLogout} className="text-red-300 hover:text-white transition-colors" title="Sair">
                <LogOut size={14} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-red-700 text-xs ${userRole === 'admin' ? 'bg-white' : 'bg-red-200'}`}>
                {userRole === 'admin' ? 'AD' : 'EN'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">
            {activeTab === 'pos' ? 'Ponto de Venda' : activeTab === 'sales' ? 'Relatórios' : activeTab === 'deliveries' ? 'Central de Entregas' : activeTab === 'fiscal' ? 'Notas Fiscais' : activeTab === 'customers' ? 'Gestão de Clientes' : activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 capitalize">{userRole}</p>
              <p className="text-xs text-gray-500">Pitangueiras Gás e Água</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${userRole === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}>
              {userRole === 'admin' ? 'AD' : 'EN'}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {userRole === 'admin' && activeTab === 'dashboard' && <DashboardView sales={sales} products={products} />}
          {userRole === 'admin' && activeTab === 'pos' && 
            <POSView 
              products={products} 
              addToCart={addToCart} 
              cart={cart} 
              updateCartQuantity={updateCartQuantity} 
              removeFromCart={removeFromCart} 
              cartTotal={cartTotal} 
              finalizeSale={finalizeSale} 
            />}
          {userRole === 'admin' && activeTab === 'inventory' && 
            <InventoryView 
              showTrash={showTrash}
              setShowTrash={setShowTrash}
              activeTrash={trash} // Trash agora vem do DB
              products={products}
              updateStock={updateStock}
              updatePrice={updatePrice}
              moveToTrash={(id) => setDeleteConfirmationId(id)}
              restoreFromTrash={restoreFromTrash}
              deletePermanently={deletePermanently}
              setDeleteConfirmationId={setDeleteConfirmationId}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProduct}
              deleteConfirmationId={deleteConfirmationId}
              executeMoveToTrash={executeMoveToTrash}
            />}
          {userRole === 'admin' && activeTab === 'fiscal' && 
            <FiscalView 
              invoices={invoices}
              setInvoices={setInvoices}
              sales={sales}
              setFiscalModalOpen={setFiscalModalOpen}
              fiscalModalOpen={fiscalModalOpen}
              selectedSaleForInvoice={selectedSaleForInvoice}
              setSelectedSaleForInvoice={setSelectedSaleForInvoice}
              documentInput={documentInput}
              setDocumentInput={setDocumentInput}
              handleEmitInvoice={handleEmitInvoice}
              isTransmitting={isTransmitting}
              appId={appId}
            />}
          
          {userRole === 'admin' && activeTab === 'customers' && (
            <CustomersView 
              customers={customers} 
              appId={appId}
              userId={user ? user.uid : 'anon'}
            />
          )}
          
          {activeTab === 'sales' && <SalesHistoryView sales={sales} userRole={userRole} />}
          
          {activeTab === 'deliveries' && <DeliveriesView sales={sales} markAsDelivered={markAsDelivered} />}
        </div>
      </main>
    </div>
  );
}
