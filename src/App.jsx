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
  CreditCard,
  CreditCard as PaymentIcon,
  Banknote,
  Smartphone
} from 'lucide-react';

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

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Erro Firebase:", error);
}

const appId = 'pitangueiras-gas-app';

// --- HELPERS ---

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDateSafe = (dateString) => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  } catch { return "-"; }
};

const formatTimeSafe = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  } catch { return ""; }
};

const getRemainingTime = (dateString) => {
  if (!dateString) return "-";
  try {
    const deletionDate = new Date(dateString);
    if (isNaN(deletionDate.getTime())) return "-";
    const expirationDate = new Date(deletionDate.getTime() + (72 * 60 * 60 * 1000));
    const now = new Date();
    const diffTime = expirationDate - now;
    if (diffTime <= 0) return "Expirado";
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  } catch { return "-"; }
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => {
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
      type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- VIEWS ---

const CustomersView = ({ customers, appId }) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', cpf: '', address: '' });
  const [newDebt, setNewDebt] = useState({ purchaseDate: '', dueDate: '', amount: '', description: '' });

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address) return alert("Preencha nome e endereço");
    if (!db) return alert("Erro de conexão");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), { ...newCustomer, debts: [] });
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', cpf: '', address: '' });
    } catch (e) { console.error(e); }
  };

  const handleAddDebt = async () => {
    if (!newDebt.amount || !selectedCustomer || !db) return;
    const debt = { id: Date.now(), ...newDebt, amount: parseFloat(newDebt.amount), paid: false };
    const customerRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id);
    await updateDoc(customerRef, { debts: [debt, ...(selectedCustomer.debts || [])] });
    setNewDebt({ purchaseDate: '', dueDate: '', amount: '', description: '' });
  };

  const toggleDebtStatus = async (debtId) => {
    if (!selectedCustomer || !db) return;
    const customerRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id);
    const updatedDebts = selectedCustomer.debts.map(d => d.id === debtId ? { ...d, paid: !d.paid } : d);
    await updateDoc(customerRef, { debts: updatedDebts });
  };

  const activeCustomerData = selectedCustomer ? customers.find(c => c.id === selectedCustomer.id) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" /> Clientes</h2>
        <Button onClick={() => setIsCustomerModalOpen(true)} variant="primary"><Plus size={18} /> Novo</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Lista</div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {customers.map(customer => {
              const totalDebt = (customer.debts || []).filter(d => !d.paid).reduce((acc, d) => acc + (d.amount || 0), 0);
              return (
                <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`p-4 cursor-pointer hover:bg-blue-50 ${activeCustomerData?.id === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <h4 className="font-bold text-gray-800">{customer.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{customer.address}</p>
                  {totalDebt > 0 && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">-{formatCurrency(totalDebt)}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2">
          {activeCustomerData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{activeCustomerData.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1"><User size={14}/> {activeCustomerData.cpf || '-'} <MapPin size={14}/> {activeCustomerData.address}</div>
                </div>
                <div className="text-right"><p className="text-sm text-gray-500">Em Aberto</p><p className="text-2xl font-bold text-red-600">{formatCurrency((activeCustomerData.debts || []).filter(d => !d.paid).reduce((acc, d) => acc + (d.amount || 0), 0))}</p></div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-700 text-sm flex gap-2"><CreditCard size={16}/> Nova Venda (Fiado)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="border p-2 text-sm rounded" value={newDebt.purchaseDate} onChange={e => setNewDebt({...newDebt, purchaseDate: e.target.value})} />
                  <input type="date" className="border p-2 text-sm rounded" value={newDebt.dueDate} onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})} />
                  <input type="text" placeholder="Descrição" className="border p-2 text-sm rounded" value={newDebt.description} onChange={e => setNewDebt({...newDebt, description: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Valor" className="border p-2 text-sm rounded w-full" value={newDebt.amount} onChange={e => setNewDebt({...newDebt, amount: e.target.value})} />
                    <button onClick={handleAddDebt} className="bg-blue-600 text-white px-4 rounded"><Plus size={18} /></button>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50"><tr><th className="p-3">Data</th><th className="p-3">Desc</th><th className="p-3">Venc</th><th className="p-3 text-right">Valor</th><th className="p-3 text-center">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(activeCustomerData.debts || []).map(debt => (
                      <tr key={debt.id} className={debt.paid ? 'opacity-50' : ''}>
                        <td className="p-3">{formatDateSafe(debt.purchaseDate)}</td>
                        <td className="p-3">{debt.description}</td>
                        <td className="p-3 text-red-600">{formatDateSafe(debt.dueDate)}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(debt.amount)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => toggleDebtStatus(debt.id)} className={`px-2 py-1 rounded text-xs font-bold ${debt.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{debt.paid ? 'PAGO' : 'PENDENTE'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <div className="text-center p-12 text-gray-400">Selecione um cliente</div>}
        </div>
      </div>
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">
            <h3 className="font-bold">Novo Cliente</h3>
            <input className="w-full border p-2 rounded" placeholder="Nome" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
            <input className="w-full border p-2 rounded" placeholder="CPF" value={newCustomer.cpf} onChange={e => setNewCustomer({...newCustomer, cpf: e.target.value})} />
            <input className="w-full border p-2 rounded" placeholder="Endereço" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
            <div className="flex gap-2"><Button onClick={() => setIsCustomerModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleAddCustomer}>Salvar</Button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ sales, products }) => {
  const today = new Date().toLocaleDateString();
  const salesToday = sales.filter(s => {
      try { return new Date(s.date).toLocaleDateString() === today; } 
      catch { return false; }
  });
  const revenueToday = salesToday.reduce((acc, s) => acc + (s.total || 0), 0);
  const lowStockItems = products.filter(p => p.stock < 15);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-full text-white"><DollarSign size={24} /></div>
            <div><p className="text-sm text-blue-700 font-medium">Faturamento Hoje</p><h3 className="text-2xl font-bold text-gray-800">{formatCurrency(revenueToday)}</h3></div>
          </div>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-full text-white"><TrendingUp size={24} /></div>
            <div><p className="text-sm text-emerald-600 font-medium">Vendas Totais</p><h3 className="text-2xl font-bold text-gray-800">{sales.length}</h3></div>
          </div>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-full text-white"><Package size={24} /></div>
            <div><p className="text-sm text-red-600 font-medium">Estoque Baixo</p><h3 className="text-2xl font-bold text-gray-800">{lowStockItems.length}</h3></div>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><History size={20} className="text-blue-600"/> Últimas Vendas</h3>
          <div className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Horário</th><th className="p-3">Valor</th><th className="p-3">Tipo</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sem vendas</td></tr> : sales.slice(0, 5).map(sale => (
                  <tr key={sale.id}>
                    <td className="p-3">{formatTimeSafe(sale.date)}</td>
                    <td className="p-3 font-medium">{formatCurrency(sale.total)}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${sale.type === 'entrega' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{sale.type || 'Venda'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500"/> Alertas</h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? <p className="text-center text-gray-400 py-4">Estoque normal</p> : lowStockItems.slice(0,5).map(item => (
              <div key={item.id} className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">{item.category === 'gas' ? <Flame size={18} className="text-red-500" /> : <Droplets size={18} className="text-blue-500" />}<span className="font-medium">{item.name}</span></div>
                <span className="font-bold text-red-600">{item.stock} un.</span>
              </div>
            ))}
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

  const filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6 animate-in slide-in-from-right duration-300">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" />
          <input type="text" placeholder="Buscar produto..." className="flex-1 outline-none text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {filteredProducts.map(product => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-red-300 flex flex-col gap-2 group ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="flex justify-between items-start w-full">
                <div className={`p-2 rounded-lg ${product.category === 'gas' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {product.category === 'gas' ? <Flame size={20} /> : <Droplets size={20} />}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Est: {product.stock}</span>
              </div>
              <div><h4 className="font-bold text-gray-800 leading-tight group-hover:text-red-600">{product.name}</h4><p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p></div>
            </button>
          ))}
        </div>
      </div>
      <div className="w-full md:w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200"><h3 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={20} /> Carrinho</h3></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><ShoppingCart size={48} className="mb-2" /><p>Vazio</p></div> : 
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div className="flex-1"><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">{formatCurrency(item.price)}</p></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200"><button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-gray-100"><Minus size={14}/></button><span className="text-sm font-bold w-6 text-center">{item.quantity}</span><button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-gray-100"><Plus size={14}/></button></div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          }
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="flex justify-between items-center text-lg font-bold"><span>Total</span><span>{formatCurrency(cartTotal)}</span></div>
          {paymentModalOpen ? (
            <div className="space-y-3 animate-in slide-in-from-bottom">
              <div className="flex justify-between border-b pb-2"><button onClick={() => setIsDelivery(false)} className={`px-3 py-1 rounded text-xs font-bold ${!isDelivery ? 'bg-blue-100 text-blue-700' : ''}`}>Balcão</button><button onClick={() => setIsDelivery(true)} className={`px-3 py-1 rounded text-xs font-bold ${isDelivery ? 'bg-red-100 text-red-700' : ''}`}>Entrega</button></div>
              {isDelivery && <div className="space-y-2"><input className="w-full p-2 text-sm border rounded" placeholder="Cliente" value={clientName} onChange={e => setClientName(e.target.value)} /><input className="w-full p-2 text-sm border rounded" placeholder="Endereço" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} /></div>}
              <div className="grid grid-cols-2 gap-2">{['Dinheiro', 'PIX', 'Cartão'].map(method => (<button key={method} onClick={() => { finalizeSale(method, isDelivery, { address: deliveryAddress, client: clientName }); setPaymentModalOpen(false); }} className="p-2 bg-white border rounded text-sm hover:bg-blue-50">{method}</button>))}</div>
              <button onClick={() => setPaymentModalOpen(false)} className="w-full text-center text-sm text-red-500">Cancelar</button>
            </div>
          ) : <Button variant="success" className="w-full py-3" disabled={cart.length === 0} onClick={() => setPaymentModalOpen(true)}>Finalizar</Button>}
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
        <h2 className="text-2xl font-bold text-gray-800">{showTrash ? 'Lixeira' : 'Estoque'}</h2>
        <div className="flex gap-2">
          <Button variant={showTrash ? 'primary' : 'outline'} onClick={() => setShowTrash(!showTrash)} className={showTrash ? 'bg-red-600 text-white' : ''}>{showTrash ? <Package size={18} /> : <Trash2 size={18} />}{showTrash ? 'Voltar' : 'Lixeira'}</Button>
          {!showTrash && <Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Novo</Button>}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Produto</th><th className="p-4 text-center">Estoque</th><th className="p-4 text-right">Preço</th><th className="p-4 text-center">Ações</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {(showTrash ? activeTrash : products).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{p.name}</td>
                <td className="p-4"><div className="flex items-center justify-center gap-2">{!showTrash && <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))} className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-red-100"><Minus size={14}/></button>}<span className="w-8 text-center">{p.stock}</span>{!showTrash && <button onClick={() => updateStock(p.id, p.stock + 1)} className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-green-100"><Plus size={14}/></button>}</div></td>
                <td className="p-4 text-right">{!showTrash ? <input type="number" step="0.10" value={p.price} onChange={e => updatePrice(p.id, e.target.value)} className="w-20 text-right border rounded p-1" /> : formatCurrency(p.price)}</td>
                <td className="p-4 text-center">{showTrash ? <button onClick={() => restoreFromTrash(p.id)} className="text-green-600 p-2"><RotateCcw size={18}/></button> : <button onClick={() => setDeleteConfirmationId(p.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18}/></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">
            <h3 className="font-bold text-lg">Novo Produto</h3>
            <input className="w-full border p-2 rounded" placeholder="Nome" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input className="w-full border p-2 rounded" type="number" placeholder="Preço" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            <input className="w-full border p-2 rounded" type="number" placeholder="Estoque" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
            <select className="w-full border p-2 rounded" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option value="gas">Gás</option><option value="water">Água</option><option value="acessorios">Acessórios</option></select>
            <div className="flex gap-2"><Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={handleAddProduct}>Salvar</Button></div>
          </div>
        </div>
      )}
      {deleteConfirmationId && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-80 text-center"><h3 className="font-bold mb-2">Excluir item?</h3><div className="flex gap-2 justify-center"><Button onClick={() => setDeleteConfirmationId(null)} variant="secondary">Não</Button><Button onClick={executeMoveToTrash} variant="danger">Sim</Button></div></div></div>}
    </div>
  );
};

const SalesHistoryView = ({ sales, userRole }) => {
  const [filterDate, setFilterDate] = useState("");
  const filteredSales = (filterDate ? sales.filter(s => s.date && s.date.startsWith(filterDate)) : sales).filter(s => userRole === 'entregador' ? s.type === 'entrega' : true);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">Histórico</h2><input type="date" className="border rounded p-2" onChange={e => setFilterDate(e.target.value)} /></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Data</th><th className="p-4">Detalhes</th><th className="p-4">Status</th><th className="p-4 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">{formatDateSafe(s.date)} <span className="text-gray-400 text-xs">{formatTimeSafe(s.date)}</span></td>
                <td className="p-4 text-sm">{s.address ? <span className="flex gap-1 text-blue-600 font-bold"><MapPin size={12}/> {s.address}</span> : 'Balcão'}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{s.status}</span></td>
                <td className="p-4 text-right font-bold">{formatCurrency(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DeliveriesView = ({ sales, markAsDelivered }) => {
  const pending = sales.filter(s => s.type === 'entrega' && s.status === 'pendente');
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold flex gap-2"><Truck className="text-blue-600"/> Pendentes</h2>
      {pending.length === 0 ? <div className="bg-white p-12 rounded-xl border text-center text-gray-500">Tudo entregue!</div> : 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map(s => (
            <Card key={s.id} className="border-l-4 border-l-red-500 relative">
              <div className="flex justify-between mb-4"><div><span className="text-xs font-bold text-gray-400">PEDIDO</span><h3 className="font-bold">{s.client || 'Cliente'}</h3></div><span className="bg-red-100 text-red-700 px-2 rounded text-xs h-fit">Pendente</span></div>
              <div className="space-y-2 mb-4"><div className="flex gap-2"><MapPin size={18} className="text-blue-500"/><p className="text-sm">{s.address}</p></div><div className="flex gap-2"><DollarSign size={18} className="text-green-500"/><p className="text-sm font-bold">{formatCurrency(s.total)} ({s.method})</p></div></div>
              <div className="flex gap-2"><Button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(s.address)}`, '_blank')} className="flex-1 bg-blue-100 text-blue-700">Rota</Button><Button onClick={() => markAsDelivered(s.id)} variant="success" className="flex-1">Entregue</Button></div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
};

const FiscalView = ({ invoices, setInvoices, sales, setFiscalModalOpen, fiscalModalOpen, selectedSaleForInvoice, setSelectedSaleForInvoice, documentInput, setDocumentInput, handleEmitInvoice, isTransmitting, appId }) => {
  const onEmit = async () => {
    if (!documentInput || !db) return alert("Erro");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'invoices'), {
        id: Date.now(), number: Math.floor(Math.random()*9000)+1000, date: new Date().toISOString(), recipient: documentInput, total: selectedSaleForInvoice?.total || 0, status: 'authorized'
      });
      handleEmitInvoice();
    } catch(e){ console.error(e); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between"><h2 className="text-2xl font-bold flex gap-2"><FileText className="text-blue-600"/> Fiscal</h2><Button onClick={() => setFiscalModalOpen(true)} variant="primary">Nova Nota</Button></div>
      <div className="bg-white rounded-xl border overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Número</th><th className="p-4">Destinatário</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Status</th></tr></thead><tbody>{invoices.map(i => (<tr key={i.id} className="border-t"><td className="p-4">{i.number}</td><td className="p-4">{i.recipient}</td><td className="p-4 text-right">{formatCurrency(i.total)}</td><td className="p-4 text-center"><span className="bg-green-100 text-green-700 px-2 rounded text-xs">Autorizada</span></td></tr>))}</tbody></table></div>
      {fiscalModalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-96 space-y-4"><h3 className="font-bold">Emitir Nota</h3><select className="w-full border p-2 rounded" onChange={e => { const s = sales.find(x => x.id === e.target.value); setSelectedSaleForInvoice(s); setDocumentInput(s?.client || ''); }}><option>Selecione Venda</option>{sales.map(s => <option key={s.id} value={s.id}>#{String(s.id).slice(-4)} - {formatCurrency(s.total)}</option>)}</select><input className="w-full border p-2 rounded" placeholder="CPF/CNPJ" value={documentInput} onChange={e => setDocumentInput(e.target.value)} /><div className="flex gap-2"><Button onClick={() => setFiscalModalOpen(false)} variant="secondary">Cancelar</Button><Button onClick={onEmit} disabled={isTransmitting}>{isTransmitting ? '...' : 'Emitir'}</Button></div></div></div>}
    </div>
  );
};

const StaffLoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const hash = window.location.hash;
    if (hash === '#/admin' && username === 'admin' && password === '1234') onLogin('admin');
    else if (hash === '#/driver' && username === 'entregador' && password === '1234') onLogin('entregador');
    else setError('Acesso negado');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8">
        <div className="text-center mb-8"><div className="inline-flex p-4 bg-gray-100 rounded-full mb-4"><User size={32}/></div><h2 className="text-2xl font-bold">Acesso Restrito</h2></div>
        <form onSubmit={handleSubmit} className="space-y-6"><input className="w-full border p-3 rounded" placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} /><input type="password" className="w-full border p-3 rounded" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />{error && <p className="text-red-500 text-sm">{error}</p>}<Button type="submit" className="w-full bg-slate-900 text-white py-3">Entrar</Button></form>
      </div>
    </div>
  );
};

const CustomerOrderView = ({ products, onOrder }) => {
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('products');
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', payment: 'Dinheiro' });

  const addToCart = (product) => {
    if (product.stock <= 0) return alert("Sem estoque");
    const exists = cart.find(i => i.id === product.id);
    if (exists && exists.quantity >= product.stock) return;
    setCart(exists ? cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...cart, { ...product, quantity: 1 }]);
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  if (step === 'success') return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-3xl shadow-xl text-center"><CheckCircle size={48} className="text-green-600 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Recebido!</h2><Button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white mt-4">Novo Pedido</Button></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="bg-gradient-to-r from-red-700 to-blue-600 text-white p-4 sticky top-0 z-20 shadow-lg flex justify-between items-center"><button onClick={() => setStep('products')} className={`text-white ${step !== 'checkout' ? 'opacity-0' : ''}`}><ChevronLeft /></button><div className="text-center"><h1 className="font-bold text-xl">Pitangueiras</h1><p className="text-xs text-blue-100 uppercase">Gás e Água</p></div><div className="w-6"></div></header>
      <main className="p-4 max-w-3xl mx-auto">
        {step === 'products' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Faça seu Pedido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${p.category === 'gas' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{p.category === 'gas' ? <Flame size={32}/> : <Droplets size={32}/>}</div>
                  <div className="flex-1"><h3 className="font-bold text-lg">{p.name}</h3><p className={`font-bold text-xl ${p.category === 'gas' ? 'text-red-600' : 'text-blue-600'}`}>{formatCurrency(p.price)}</p></div>
                  <div className="flex flex-col items-end">
                    {cart.find(i => i.id === p.id) ? 
                      <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1 border"><button onClick={() => setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))} className="text-green-600 p-1"><Plus size={16}/></button><span className="font-bold">{cart.find(i => i.id === p.id).quantity}</span><button onClick={() => setCart(cart.map(i => i.id === p.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0))} className="text-red-500 p-1"><Minus size={16}/></button></div> 
                      : <Button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`w-10 h-10 rounded-full p-0 flex items-center justify-center ${p.category === 'gas' ? 'bg-red-600' : 'bg-blue-600'} text-white`}><Plus/></Button>
                    }
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-30"><div className="max-w-3xl mx-auto flex justify-between items-center"><div className="text-2xl font-bold">{formatCurrency(total)}</div><Button onClick={() => setStep('checkout')} className="bg-green-600 text-white px-8 py-3 rounded-xl text-lg">Finalizar</Button></div></div>}
          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
            <h2 className="text-xl font-bold border-b pb-2">Finalizar</h2>
            <div className="space-y-2">{cart.map(i => <div key={i.id} className="flex justify-between"><span>{i.quantity}x {i.name}</span><span className="font-bold">{formatCurrency(i.price * i.quantity)}</span></div>)}</div>
            <div className="pt-4 border-t flex justify-between text-xl font-bold"><span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span></div>
            <div className="space-y-4">
              <input className="w-full border bg-gray-50 p-3 rounded-xl" placeholder="Seu Nome" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
              <input className="w-full border bg-gray-50 p-3 rounded-xl" placeholder="Endereço Completo" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
              <div className="grid grid-cols-3 gap-2">{['Dinheiro', 'PIX', 'Cartão'].map(m => <button key={m} onClick={() => setCustomerInfo({...customerInfo, payment: m})} className={`p-3 border rounded-xl ${customerInfo.payment === m ? 'bg-blue-50 border-blue-500 text-blue-700' : ''}`}>{m}</button>)}</div>
              <Button onClick={() => { if(!customerInfo.name || !customerInfo.address) return alert('Preencha tudo'); onOrder({ cart, total, customer: customerInfo }); setStep('success'); }} className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl">Confirmar Pedido</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [user, setUser] = useState(null);
  
  // Pos State
  const [cart, setCart] = useState([]);

  // Inventory State
  const [trash, setTrash] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'water', price: '', stock: '' });
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  // Fiscal State
  const [fiscalModalOpen, setFiscalModalOpen] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);
  const [documentInput, setDocumentInput] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => { if (auth) signInAnonymously(auth); if (auth) onAuthStateChanged(auth, setUser); }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubP = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => {
      const d = s.docs.map(x => ({id:x.id, ...x.data()}));
      setProducts(d.filter(p => !p.deletedAt));
      setTrash(d.filter(p => p.deletedAt));
    });
    const unsubS = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), s => setSales(s.docs.map(x => ({id:x.id, ...x.data()})).sort((a,b) => new Date(b.date)-new Date(a.date))));
    const unsubC = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), s => setCustomers(s.docs.map(x => ({id:x.id, ...x.data()}))));
    const unsubI = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'invoices'), s => setInvoices(s.docs.map(x => ({id:x.id, ...x.data()}))));
    return () => { unsubP(); unsubS(); unsubC(); unsubI(); };
  }, [user]);

  const handleLogin = (role) => { setIsAuthenticated(true); setUserRole(role); setActiveTab(role === 'admin' ? 'dashboard' : 'deliveries'); };
  const handleLogout = () => { setIsAuthenticated(false); window.location.hash = '#/'; };

  const handleCustomerOrder = async (data) => {
    if (!db) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), {
      date: new Date().toISOString(), total: data.total, items: data.cart.map(i => ({name: i.name, qtd: i.quantity})), method: data.customer.payment, type: 'entrega', status: 'pendente', address: data.customer.address, client: data.customer.name
    });
  };

  const updateStock = async (id, val) => { if(db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id), {stock: parseInt(val)}); };
  const updatePrice = async (id, val) => { if(db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id), {price: parseFloat(val)}); };
  const handleAddProduct = async () => { if(db) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {...newProduct, stock: parseInt(newProduct.stock), price: parseFloat(newProduct.price)}); setIsModalOpen(false); };
  
  const executeMoveToTrash = async () => { if(db && deleteConfirmationId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', deleteConfirmationId), {deletedAt: new Date().toISOString()}); setDeleteConfirmationId(null); };
  const restoreFromTrash = async (id) => { if(db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id), {deletedAt: null}); };
  const deletePermanently = async (id) => { if(db && confirm('Excluir?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id)); };

  const finalizeSale = async (method, isDelivery, details) => {
    if(!db) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), {
      date: new Date().toISOString(), total: cart.reduce((a,b)=>a+b.price*b.quantity,0), items: cart.map(i=>({name:i.name, qtd:i.quantity})), method, type: isDelivery?'entrega':'balcao', status: isDelivery?'pendente':'entregue', ...details
    });
    setCart([]);
  };

  if (route === '#/admin') {
    if (!isAuthenticated || userRole !== 'admin') return <StaffLoginScreen onLogin={handleLogin} />;
    return (
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-red-900 text-white p-6 hidden md:block">
          <h1 className="text-xl font-bold mb-8">Pitangueiras<br/>Admin</h1>
          <nav className="space-y-2">
            {[
              {id:'dashboard', icon:LayoutDashboard, l:'Dashboard'},
              {id:'pos', icon:ShoppingCart, l:'PDV'},
              {id:'inventory', icon:Package, l:'Estoque'},
              {id:'customers', icon:Users, l:'Clientes'},
              {id:'sales', icon:History, l:'Histórico'},
              {id:'fiscal', icon:FileText, l:'Fiscal'}
            ].map(m => <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`flex gap-3 w-full p-2 rounded ${activeTab===m.id?'bg-blue-600':''}`}><m.icon/>{m.l}</button>)}
          </nav>
          <div className="absolute bottom-4"><button onClick={handleLogout} className="flex gap-2 items-center text-red-200"><LogOut size={16}/> Sair</button></div>
        </aside>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {activeTab === 'dashboard' && <DashboardView sales={sales} products={products} />}
          {activeTab === 'pos' && <POSView products={products} cart={cart} addToCart={(p) => {const ex = cart.find(x=>x.id===p.id); if(ex) setCart(cart.map(x=>x.id===p.id?{...x, quantity:x.quantity+1}:x)); else setCart([...cart, {...p, quantity:1}]);}} updateCartQuantity={(id,d)=>setCart(cart.map(i=>i.id===id?{...i, quantity: Math.max(1, i.quantity+d)}:i))} removeFromCart={(id)=>setCart(cart.filter(i=>i.id!==id))} cartTotal={cart.reduce((a,b)=>a+b.price*b.quantity,0)} finalizeSale={finalizeSale}/>}
          {activeTab === 'inventory' && <InventoryView showTrash={showTrash} setShowTrash={setShowTrash} activeTrash={trash} products={products} updateStock={updateStock} updatePrice={updatePrice} moveToTrash={setDeleteConfirmationId} restoreFromTrash={restoreFromTrash} deletePermanently={deletePermanently} setDeleteConfirmationId={setDeleteConfirmationId} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} newProduct={newProduct} setNewProduct={setNewProduct} handleAddProduct={handleAddProduct} deleteConfirmationId={deleteConfirmationId} executeMoveToTrash={executeMoveToTrash} />}
          {activeTab === 'customers' && <CustomersView customers={customers} appId={appId} />}
          {activeTab === 'sales' && <SalesHistoryView sales={sales} userRole="admin" />}
          {activeTab === 'fiscal' && <FiscalView invoices={invoices} setInvoices={setInvoices} sales={sales} setFiscalModalOpen={setFiscalModalOpen} fiscalModalOpen={fiscalModalOpen} selectedSaleForInvoice={selectedSaleForInvoice} setSelectedSaleForInvoice={setSelectedSaleForInvoice} documentInput={documentInput} setDocumentInput={setDocumentInput} handleEmitInvoice={handleEmitInvoice} isTransmitting={isTransmitting} appId={appId} />}
        </main>
      </div>
    );
  }

  if (route === '#/driver') {
    if (!isAuthenticated || userRole !== 'entregador') return <StaffLoginScreen onLogin={handleLogin} />;
    return (
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-blue-900 text-white p-6 hidden md:block">
          <h1 className="text-xl font-bold mb-8">Entregas</h1>
          <nav className="space-y-2">
            <button onClick={()=>setActiveTab('deliveries')} className={`flex gap-3 w-full p-2 rounded ${activeTab==='deliveries'?'bg-orange-500':''}`}><Truck/> Entregas</button>
            <button onClick={()=>setActiveTab('sales')} className={`flex gap-3 w-full p-2 rounded ${activeTab==='sales'?'bg-orange-500':''}`}><History/> Histórico</button>
          </nav>
          <div className="absolute bottom-4"><button onClick={handleLogout} className="flex gap-2 items-center text-blue-200"><LogOut size={16}/> Sair</button></div>
        </aside>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {activeTab === 'deliveries' && <DeliveriesView sales={sales} markAsDelivered={async (id) => { if(db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sales', id), {status: 'entregue'}); }} />}
          {activeTab === 'sales' && <SalesHistoryView sales={sales} userRole="entregador" />}
        </main>
      </div>
    );
  }

  return <CustomerOrderView products={products} onOrder={handleCustomerOrder} />;
}