(function () {
  
  const LS_ROOMS = 'HOTEL_ROOMS_V4';
  const LS_BOOKINGS = 'HOTEL_BOOKINGS_V4';
  const LS_UI = 'HOTEL_UI_V4';

  const roomContainer = document.getElementById('roomContainer');
  const paginationEl = document.getElementById('pagination');

  const btnAll = document.getElementById('filterAll');
  const btnAvailable = document.getElementById('filterAvailable');
  const btnBooked = document.getElementById('filterBooked');
  const categorySelect = document.getElementById('categorySelect');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');

  const statTotal = document.getElementById('statTotal');
  const statBooked = document.getElementById('statBooked');
  const statAvailable = document.getElementById('statAvailable');

  const navBtns = document.querySelectorAll('.nav-btn');
  const pageTitle = document.getElementById('pageTitle');
  const historyTableBody = document.querySelector('#historyTable tbody');

  const bookingRoom = document.getElementById('bookingRoom');
  const bookingRoomType = document.getElementById('bookingRoomType');
  const bookingForm = document.getElementById('bookingForm');
  const billArea = document.getElementById('billArea');
  const downloadLastReceipt = document.getElementById('downloadLastReceipt');

  const checkinModal = document.getElementById('checkinModal');
  const modalTitle = document.getElementById('modalTitle');
  const checkinForm = document.getElementById('checkinForm');
  const modalRoomNumber = document.getElementById('modalRoomNumber');
  const modalRoomType = document.getElementById('modalRoomType');
  const modalGuestName = document.getElementById('modalGuestName');
  const modalPhone = document.getElementById('modalPhone');
  const modalEmail = document.getElementById('modalEmail');
  const modalCheckin = document.getElementById('modalCheckin');
  const modalCheckout = document.getElementById('modalCheckout');
  const modalExtras = document.getElementById('modalExtras');
  const modalBilling = document.getElementById('modalBilling');
  const calcBillBtn = document.getElementById('calcBillBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  const darkToggle = document.getElementById('darkToggle');
  const logoutBtn = document.getElementById('logoutBtn');

  let rooms = [];
  let bookings = [];
  let ui = {
    filter: 'All',
    category: 'All',
    search: '',
    page: 1,
    pageSize: 10,
    dark: false
  };

  const DEFAULT_PRICES = { Standard: 1000, AC: 1500, Deluxe: 2500, 'Non-AC': 800 };

  function createDefaultRooms() {
    const arr = [];
    for (let i = 1; i <= 30; i++) {
      let t;
      if (i % 4 === 1) t = 'Standard';
      else if (i % 4 === 2) t = 'AC';
      else if (i % 4 === 3) t = 'Deluxe';
      else t = 'Non-AC';
      arr.push({ id: i, number: i, type: t, price: DEFAULT_PRICES[t], guest: 'Empty' });
    }
    return arr;
  }

  function loadData() {
    try {
      const rawRooms = localStorage.getItem(LS_ROOMS);
      rooms = rawRooms ? JSON.parse(rawRooms) : createDefaultRooms();

      const rawBookings = localStorage.getItem(LS_BOOKINGS);
      bookings = rawBookings ? JSON.parse(rawBookings) : [];

      const rawUI = localStorage.getItem(LS_UI);
      if (rawUI) ui = Object.assign(ui, JSON.parse(rawUI));
    } catch (e) {
      console.error(e);
      rooms = createDefaultRooms();
      bookings = [];
    }
    applyDark(ui.dark);
  }

  function saveRooms() { localStorage.setItem(LS_ROOMS, JSON.stringify(rooms)); }
  function saveBookings() { localStorage.setItem(LS_BOOKINGS, JSON.stringify(bookings)); }
  function saveUI() { localStorage.setItem(LS_UI, JSON.stringify(ui)); }

  function filteredRooms() {
    let arr = rooms.slice();
    if (ui.category && ui.category !== 'All') arr = arr.filter(r => r.type === ui.category);
    if (ui.filter === 'Available') arr = arr.filter(r => r.guest === 'Empty');
    if (ui.filter === 'Booked') arr = arr.filter(r => r.guest !== 'Empty');
    if (ui.search && ui.search.trim()) {
      const q = ui.search.trim();
      arr = arr.filter(r => String(r.number).includes(q));
    }
    return arr;
  }

  function pageCount(total) { return Math.max(1, Math.ceil(total / ui.pageSize)); }

  function render() {
    updateStats();
    renderRoomGrid();
    renderPagination();
    renderBookingRoomSelect();
    renderHistoryTable();
    updateControls();
  }

  function updateStats() {
    const total = rooms.length;
    const booked = rooms.filter(r => r.guest !== 'Empty').length;
    const available = total - booked;
    statTotal.innerText = total;
    statBooked.innerText = booked;
    statAvailable.innerText = available;
  }

  function renderRoomGrid() {
    const list = filteredRooms();
    const pages = pageCount(list.length);
    if (ui.page > pages) ui.page = pages;
    const start = (ui.page - 1) * ui.pageSize;
    const paged = list.slice(start, start + ui.pageSize);

    roomContainer.innerHTML = '';
    if (paged.length === 0) {
      roomContainer.innerHTML = '<div class="empty-message">No rooms found.</div>';
      return;
    }

    paged.forEach(r => {
      const card = document.createElement('div');
      card.className = 'room-card';

      const isEmpty = r.guest === 'Empty';
      card.innerHTML = `
        <div class="room-card-top">
          <div>
            <div class="room-number">Room ${r.number}</div>
            <div class="room-price">₹${r.price} / night</div>
          </div>
          <div class="room-type">${r.type}</div>
        </div>

        <div class="room-status ${isEmpty ? 'available' : 'occupied'}">
          ${isEmpty ? 'Available' : 'Occupied by ' + escapeHtml(r.guest)}
        </div>

        <div class="room-actions">
          <button class="btn small ${isEmpty ? 'primary' : 'danger'}" data-action="${isEmpty ? 'checkin' : 'checkout'}" data-id="${r.id}">
            ${isEmpty ? 'Check-In' : 'Check-Out'}
          </button>
          <button class="btn small ghost" data-action="edit" data-id="${r.id}">Edit</button>
        </div>
      `;
      roomContainer.appendChild(card);
    });


    roomContainer.querySelectorAll('button[data-action]').forEach(b => {
      const action = b.dataset.action;
      const id = Number(b.dataset.id);
      if (action === 'checkin') b.addEventListener('click', () => openCheckinModal(id));
      if (action === 'checkout') b.addEventListener('click', () => doCheckout(id));
      if (action === 'edit') b.addEventListener('click', () => editRoom(id));
    });
  }

  function renderPagination() {
    const list = filteredRooms();
    const pages = pageCount(list.length);
    paginationEl.innerHTML = '';
    if (pages <= 1) return;

    const prev = document.createElement('button');
    prev.className = 'btn small ghost';
    prev.innerText = 'Prev';
    prev.disabled = ui.page === 1;
    prev.addEventListener('click', () => { ui.page = Math.max(1, ui.page - 1); saveUI(); render(); });
    paginationEl.appendChild(prev);

    let start = Math.max(1, ui.page - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let p = start; p <= end; p++) {
      const btn = document.createElement('button');
      btn.className = 'btn small' + (p === ui.page ? ' primary' : ' ghost');
      btn.innerText = p;
      btn.addEventListener('click', () => { ui.page = p; saveUI(); render(); });
      paginationEl.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'btn small ghost';
    next.innerText = 'Next';
    next.disabled = ui.page === pages;
    next.addEventListener('click', () => { ui.page = Math.min(pages, ui.page + 1); saveUI(); render(); });
    paginationEl.appendChild(next);
  }

  function renderBookingRoomSelect() {
    if (!bookingRoom) return;
    bookingRoom.innerHTML = '';
    rooms.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.innerText = `Room ${r.number} - ${r.type} ${r.guest === 'Empty' ? '' : '(Occupied)'}`;
      bookingRoom.appendChild(opt);
    });
 
    bookingRoom.addEventListener('change', () => {
      const id = Number(bookingRoom.value);
      const r = rooms.find(x => x.id === id);
      bookingRoomType.value = r ? r.type : '';
    });
    if (bookingRoom.options.length > 0) {
      bookingRoomType.value = rooms[0].type;
    }
  }

  function openCheckinModal(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return alert('Room not found');
    if (room.guest !== 'Empty') return alert('Room currently occupied');

    modalTitle.innerText = `Check-In → Room ${room.number} (${room.type})`;
    modalRoomNumber.value = room.number;
    modalRoomType.value = room.type;
    modalGuestName.value = '';
    modalPhone.value = '';
    modalEmail.value = '';
    modalCheckin.value = todayISO();
    modalCheckout.value = nextDayISO();
    modalExtras.value = '0';
    modalBilling.innerText = 'Calculate billing to see the summary.';
    checkinModal.style.display = 'flex';
    modalGuestName.focus();


    checkinModal.dataset.roomId = String(room.id);
  }

  function calculateModalBilling() {
    const id = Number(checkinModal.dataset.roomId);
    const room = rooms.find(r => r.id === id);
    if (!room) return alert('Room not found');

    const ci = modalCheckin.value;
    const co = modalCheckout.value;
    if (!ci || !co) return alert('Select check-in and check-out dates');
    const d1 = new Date(ci);
    const d2 = new Date(co);
    if (isNaN(d1) || isNaN(d2) || d2 <= d1) return alert('Invalid dates - checkout must be after check-in');

    const nights = Math.round((d2 - d1) / (1000*60*60*24));
    const rate = Number(room.price) || DEFAULT_PRICES[room.type] || DEFAULT_PRICES.Standard;
    const extrasPerNight = Number(modalExtras.value) || 0;
    const base = rate * nights;
    const extrasTotal = extrasPerNight * nights;
    const tax = Math.round((base + extrasTotal) * 0.12);
    const total = base + extrasTotal + tax;

    modalBilling.innerText = [
      `Nights: ${nights}`,
      `Rate/night: ₹${rate}`,
      `Base: ₹${base}`,
      `Extras total: ₹${extrasTotal}`,
      `Tax (12%): ₹${tax}`,
      `----------`,
      `Total: ₹${total}`
    ].join('\n');

    checkinModal.dataset.calc = JSON.stringify({ nights, rate, base, extrasTotal, tax, total });
  }

  function confirmModalBooking(e) {
    e.preventDefault();
    const id = Number(checkinModal.dataset.roomId);
    const room = rooms.find(r => r.id === id);
    if (!room) return alert('Room not found');
    if (room.guest !== 'Empty') return alert('Room already occupied');

    const guest = modalGuestName.value.trim();
    const phone = modalPhone.value.trim();
    const email = modalEmail.value.trim();
    const ci = modalCheckin.value;
    const co = modalCheckout.value;
    if (!guest || !ci || !co) return alert('Please fill guest name and dates');

    if (!checkinModal.dataset.calc) calculateModalBilling();
    const calc = JSON.parse(checkinModal.dataset.calc || '{}');

    const booking = {
      id: Date.now(),
      guest,
      phone,
      email,
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      checkin: ci,
      checkout: co,
      nights: calc.nights,
      rate: calc.rate,
      extras: calc.extrasTotal,
      tax: calc.tax,
      total: calc.total,
      createdAt: new Date().toISOString(),
      active: true
    };

    bookings.unshift(booking);
    room.guest = guest;
    saveRooms();
    saveBookings();
    render();
    checkinModal.style.display = 'none';
    delete checkinModal.dataset.calc;
    alert('Booking confirmed!');
   
    localStorage.setItem('HOTEL_LAST_RECEIPT', JSON.stringify(booking));
    downloadLastReceipt.disabled = false;
  }

  function doCheckout(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return alert('Not found');
    if (room.guest === 'Empty') return alert('Room already vacant');
    if (!confirm(`Check-out ${room.guest} from room ${room.number}?`)) return;
  
    room.guest = 'Empty';
    bookings = bookings.map(b => (b.roomId === room.id && b.active) ? Object.assign({}, b, { active: false }) : b);
    saveRooms();
    saveBookings();
    render();
    alert('Checked out.');
  }

  function editRoom(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const newType = prompt('Room type (Standard/AC/Deluxe/Non-AC):', room.type);
    if (!newType) return;
    const newPrice = Number(prompt('Price per night (₹):', String(room.price)));
    if (isNaN(newPrice) || newPrice <= 0) return alert('Invalid price');
    room.type = newType;
    room.price = newPrice;
    saveRooms();
    render();
    alert('Room updated.');
  }

  bookingForm && bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = Number(bookingRoom.value);
    const room = rooms.find(r => r.id === id);
    if (!room) return alert('Select a room');
    if (room.guest !== 'Empty') return alert('Room currently occupied');

    const guest = bookingGuest.value.trim();
    const phone = bookingPhone.value.trim();
    const email = bookingEmail.value.trim();
    const ci = bookingCheckin.value;
    const co = bookingCheckout.value;
    if (!guest || !ci || !co) return alert('Enter guest and dates');

    const d1 = new Date(ci), d2 = new Date(co);
    if (d2 <= d1) return alert('Checkout must be after check-in');
    const nights = Math.round((d2 - d1) / (1000*60*60*24));
    const rate = Number(room.price) || DEFAULT_PRICES[room.type] || DEFAULT_PRICES.Standard;
    const extrasPerNight = Number(bookingExtras.value) || 0;
    const base = rate * nights;
    const extrasTotal = extrasPerNight * nights;
    const tax = Math.round((base + extrasTotal) * 0.12);
    const total = base + extrasTotal + tax;

    billArea.innerText = [
      `Guest: ${guest}`,
      `Room: ${room.number} (${room.type})`,
      `Nights: ${nights}`,
      `Rate: ₹${rate}`,
      `Base: ₹${base}`,
      `Extras: ₹${extrasTotal}`,
      `Tax (12%): ₹${tax}`,
      `----------`,
      `Total: ₹${total}`
    ].join('\n');

    if (!confirm('Confirm booking & mark room occupied?')) return;
   
    const booking = {
      id: Date.now(),
      guest, phone, email,
      roomId: room.id, roomNumber: room.number, roomType: room.type,
      checkin: ci, checkout: co, nights, rate, extras: extrasTotal, tax, total,
      createdAt: new Date().toISOString(), active: true
    };
    bookings.unshift(booking);
    room.guest = guest;
    saveRooms();
    saveBookings();
    render();
    localStorage.setItem('HOTEL_LAST_RECEIPT', JSON.stringify(booking));
    downloadLastReceipt.disabled = false;
    alert('Booking confirmed from Bookings form.');
  });

  
  document.getElementById('resetBooking') && document.getElementById('resetBooking').addEventListener('click', () => {
    bookingForm.reset();
    billArea.innerText = 'No calculation yet.';
  });

  downloadLastReceipt && downloadLastReceipt.addEventListener('click', () => {
    const last = localStorage.getItem('HOTEL_LAST_RECEIPT');
    if (!last) return alert('No last receipt found');
    downloadReceipt(JSON.parse(last));
  });


  function renderHistoryTable() {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = '';
    bookings.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${b.id}</td>
        <td>${escapeHtml(b.guest)}</td>
        <td>${b.roomNumber} (${b.roomType})</td>
        <td>${b.checkin} → ${b.checkout}</td>
        <td>₹${b.total}</td>
        <td>
          <button class="btn small ghost" data-action="view" data-id="${b.id}">View</button>
          <button class="btn small" data-action="pdf" data-id="${b.id}">PDF</button>
          <button class="btn small danger" data-action="del" data-id="${b.id}">Delete</button>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });

  
    historyTableBody.querySelectorAll('button').forEach(btn => {
      const act = btn.dataset.action, id = Number(btn.dataset.id);
      if (act === 'view') btn.addEventListener('click', () => viewBooking(id));
      if (act === 'pdf') btn.addEventListener('click', () => {
        const b = bookings.find(x => x.id === id);
        if (b) downloadReceipt(b);
      });
      if (act === 'del') btn.addEventListener('click', () => {
        if (!confirm('Delete this booking?')) return;
        bookings = bookings.filter(x => x.id !== id);
        saveBookings();
        render();
      });
    });
  }

  function viewBooking(id) {
    const b = bookings.find(x => x.id === id);
    if (!b) return alert('Not found');
    const text = [
      `Receipt ID: ${b.id}`,
      `Guest: ${b.guest}`,
      `Phone: ${b.phone || '-'}`,
      `Email: ${b.email || '-'}`,
      `Room: ${b.roomNumber} (${b.roomType})`,
      `Dates: ${b.checkin} → ${b.checkout}`,
      `Nights: ${b.nights}`,
      `Rate/Night: ₹${b.rate}`,
      `Extras: ₹${b.extras}`,
      `Tax: ₹${b.tax}`,
      `Total: ₹${b.total}`
    ].join('\n');
    alert(text);
  }

  function downloadReceipt(b) {
    if (!b) return alert('No booking passed');
    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF ? window.jsPDF : null);
    if (!jsPDFCtor) return alert('jsPDF not found. Please include jsPDF CDN.');

    const doc = new jsPDFCtor({ unit: 'pt' });
    let y = 40;
    doc.setFontSize(16); doc.text('MyHotel - Booking Receipt', 40, y); y += 26;
    doc.setFontSize(11);
    doc.text(`Receipt ID: ${b.id}`, 40, y); y += 18;
    doc.text(`Guest: ${b.guest}`, 40, y); y += 18;
    doc.text(`Phone: ${b.phone || '-'}`, 40, y); y += 18;
    doc.text(`Email: ${b.email || '-'}`, 40, y); y += 18;
    doc.text(`Room: ${b.roomNumber} (${b.roomType})`, 40, y); y += 18;
    doc.text(`Check-in: ${b.checkin}`, 40, y); y += 18;
    doc.text(`Check-out: ${b.checkout}`, 40, y); y += 18;
    doc.text(`Nights: ${b.nights}`, 40, y); y += 18;
    doc.text(`Rate/Night: ₹${b.rate}`, 40, y); y += 18;
    doc.text(`Extras: ₹${b.extras}`, 40, y); y += 18;
    doc.text(`Tax: ₹${b.tax}`, 40, y); y += 22;
    doc.setFontSize(13);
    doc.text(`Total Paid: ₹${b.total}`, 40, y); y += 28;
    doc.setFontSize(10);
    doc.text('Thank you for choosing MyHotel!', 40, y);
    doc.save(`receipt_${b.id}.pdf`);
  }

  function bindEvents() {
    
    navBtns.forEach(btn => btn.addEventListener('click', (e) => {
      navBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tab = e.currentTarget.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
      document.getElementById(tab).classList.remove('hidden');
      pageTitle.innerText = tab === 'roomsTab' ? 'Rooms' : (tab === 'bookingsTab' ? 'Bookings' : 'History');
    }));

 
    btnAll && btnAll.addEventListener('click', () => { ui.filter = 'All'; ui.page = 1; saveUI(); render(); });
    btnAvailable && btnAvailable.addEventListener('click', () => { ui.filter = 'Available'; ui.page = 1; saveUI(); render(); });
    btnBooked && btnBooked.addEventListener('click', () => { ui.filter = 'Booked'; ui.page = 1; saveUI(); render(); });

    categorySelect && categorySelect.addEventListener('change', e => { ui.category = e.target.value; ui.page = 1; saveUI(); render(); });
    searchInput && searchInput.addEventListener('input', e => { ui.search = e.target.value.replace(/[^\d]/g, ''); ui.page = 1; saveUI(); render(); });
    searchClear && searchClear.addEventListener('click', () => { searchInput.value = ''; ui.search = ''; ui.page = 1; saveUI(); render(); });

    
    bookingRoom && bookingRoom.addEventListener('change', () => {
      const id = Number(bookingRoom.value);
      const r = rooms.find(x => x.id === id);
      bookingRoomType.value = r ? r.type : '';
    });

  
    calcBillBtn && calcBillBtn.addEventListener('click', calculateModalBilling);
    cancelModalBtn && cancelModalBtn.addEventListener('click', () => { checkinModal.style.display = 'none'; });

    checkinForm && checkinForm.addEventListener('submit', confirmModalBooking);

    darkToggle && darkToggle.addEventListener('click', () => {
      ui.dark = !ui.dark; applyDark(ui.dark); saveUI();
    });
    logoutBtn && logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });

    
    checkinModal && checkinModal.addEventListener('click', (e) => {
      if (e.target === checkinModal) checkinModal.style.display = 'none';
    });
  }

  function updateControls() {
  
    [btnAll, btnAvailable, btnBooked].forEach(b => b && b.classList.remove('active'));
    if (ui.filter === 'All' && btnAll) btnAll.classList.add('active');
    if (ui.filter === 'Available' && btnAvailable) btnAvailable.classList.add('active');
    if (ui.filter === 'Booked' && btnBooked) btnBooked.classList.add('active');
   
    if (categorySelect) categorySelect.value = ui.category || 'All';
    
    if (darkToggle) darkToggle.innerText = ui.dark ? 'Light Mode' : 'Dark Mode';
  }

  function applyDark(enable) {
    if (enable) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  function saveRooms() { localStorage.setItem(LS_ROOMS, JSON.stringify(rooms)); }
  function saveBookings() { localStorage.setItem(LS_BOOKINGS, JSON.stringify(bookings)); }
  function saveUI() { localStorage.setItem(LS_UI, JSON.stringify(ui)); }

  function todayISO() {
    const d = new Date(); return d.toISOString().slice(0,10);
  }
  function nextDayISO() {
    const d = new Date(Date.now() + 24*60*60*1000); return d.toISOString().slice(0,10);
  }
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function start() {
    loadData();
    bindInitialBookingFormRefs();
    bindEvents();
    render();
   
    downloadLastReceipt && (downloadLastReceipt.disabled = !localStorage.getItem('HOTEL_LAST_RECEIPT'));
  }


  function bindInitialBookingFormRefs() {
  
    window.bookingRoom = document.getElementById('bookingRoom');
    window.bookingRoomType = document.getElementById('bookingRoomType');
    window.bookingGuest = document.getElementById('bookingGuest');
    window.bookingPhone = document.getElementById('bookingPhone');
    window.bookingEmail = document.getElementById('bookingEmail');
    window.bookingCheckin = document.getElementById('bookingCheckin');
    window.bookingCheckout = document.getElementById('bookingCheckout');
    window.bookingExtras = document.getElementById('bookingExtras');
  }

  start();

})();
