// ---------- SESSION KEY ----------
const SESSION_KEY = "ars_loggedInUser";

// ---------- HELPERS ----------
function getUsers(){
  return JSON.parse(localStorage.getItem("ars_users") || "[]");
}
function saveUsers(users){
  localStorage.setItem("ars_users", JSON.stringify(users));
}

function requireLogin(){
  const u = localStorage.getItem(SESSION_KEY);
  if(!u){
    alert("Please login first!");
    window.location.href = "login.html";
  }
}

function setNavUser(){
  const navUser = document.getElementById("navUser");
  if(!navUser) return;
  const u = localStorage.getItem(SESSION_KEY);
  navUser.innerText = u ? u : "Guest";
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  alert("Logged out successfully!");
  window.location.href = "login.html";
}

// ---------- REGISTER ----------
function registerUser(e){
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass = document.getElementById("regPass").value.trim();

  if(!name || !email || !pass){
    alert("Please fill all fields!");
    return;
  }

  let users = getUsers();
  const exists = users.some(u => u.email === email);
  if(exists){
    alert("Email already registered! Please login.");
    window.location.href = "login.html";
    return;
  }

  users.push({name,email,pass});
  saveUsers(users);

  alert("Registration successful! Please login.");
  window.location.href = "login.html";
}

// ---------- LOGIN ----------
function loginUser(e){
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value.trim();

  let users = getUsers();
  const ok = users.find(u => u.email === email && u.pass === pass);

  if(!ok){
    alert("Invalid email or password!");
    return;
  }

  localStorage.setItem(SESSION_KEY, email);
  alert("Login successful!");
  window.location.href = "index.html";
}

// ---------- HOME SEARCH ----------
function searchFlights(e){
  e.preventDefault();

  requireLogin();

  const from = document.getElementById("fromCity").value;
  const to = document.getElementById("toCity").value;
  const date = document.getElementById("travelDate").value;
  const seats = parseInt(document.getElementById("seatCount").value || "1");

  if(from === to){
    alert("From and To cannot be same!");
    return;
  }

  const bookingSearch = {from,to,date,seats};
  localStorage.setItem("ars_search", JSON.stringify(bookingSearch));

  window.location.href = "reservation.html";
}

// ---------- RESERVATION ----------
function loadReservation(){
  requireLogin();

  const search = JSON.parse(localStorage.getItem("ars_search") || "{}");
  if(!search.from){
    alert("Please search flights first!");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("routeText").innerText =
    `Route: ${search.from} → ${search.to} | Date: ${search.date} | Passengers: ${search.seats}`;

  document.getElementById("seatCountRes").value = search.seats;

  calcFare();
}

function calcFare(){
  const cls = document.getElementById("travelClass").value;
  const seats = parseInt(document.getElementById("seatCountRes").value || "1");

  let basePerSeat = 2500;
  if(cls === "Business") basePerSeat = 5200;
  if(cls === "First") basePerSeat = 8200;

  const base = basePerSeat * seats;
  const tax = Math.round(base * 0.12);
  const total = base + tax;

  document.getElementById("baseFare").innerText = "₹" + base;
  document.getElementById("taxFare").innerText = "₹" + tax;
  document.getElementById("totalFare").innerText = "₹" + total;

  localStorage.setItem("ars_fare", JSON.stringify({base,tax,total,cls,seats}));
}

function proceedTicket(){
  requireLogin();

  const pname = document.getElementById("passengerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const addr = document.getElementById("address").value.trim();

  if(!pname || !phone || !addr){
    alert("Please fill passenger details!");
    return;
  }

  const search = JSON.parse(localStorage.getItem("ars_search") || "{}");
  const fare = JSON.parse(localStorage.getItem("ars_fare") || "{}");
  const user = localStorage.getItem(SESSION_KEY);

  const ticketId = "ARS" + Math.floor(100000 + Math.random()*900000);

  const booking = {
    ticketId,
    user,
    passengerName: pname,
    phone,
    address: addr,
    from: search.from,
    to: search.to,
    date: search.date,
    seats: fare.seats,
    class: fare.cls,
    base: fare.base,
    tax: fare.tax,
    total: fare.total,
    bookedAt: new Date().toLocaleString()
  };

  localStorage.setItem("ars_currentBooking", JSON.stringify(booking));

  // Save to booking list
  const all = JSON.parse(localStorage.getItem("ars_bookings") || "[]");
  all.push(booking);
  localStorage.setItem("ars_bookings", JSON.stringify(all));

  window.location.href = "confirm.html";
}

// ---------- CONFIRM ----------
function loadConfirm(){
  requireLogin();

  const booking = JSON.parse(localStorage.getItem("ars_currentBooking") || "{}");
  if(!booking.ticketId){
    alert("No ticket found!");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("tId").innerText = booking.ticketId;
  document.getElementById("tUser").innerText = booking.user;
  document.getElementById("tName").innerText = booking.passengerName;
  document.getElementById("tPhone").innerText = booking.phone;
  document.getElementById("tRoute").innerText = booking.from + " → " + booking.to;
  document.getElementById("tDate").innerText = booking.date;
  document.getElementById("tClass").innerText = booking.class;
  document.getElementById("tSeats").innerText = booking.seats;
  document.getElementById("tFare").innerText = "₹" + booking.total;
  document.getElementById("tBooked").innerText = booking.bookedAt;
}

function printTicketPDF(){
  // Browser will open Print dialog -> choose "Save as PDF"
  window.print();
}

// ---------- MY BOOKINGS ----------
function loadMyBookings(){
  requireLogin();

  const user = localStorage.getItem(SESSION_KEY);
  const all = JSON.parse(localStorage.getItem("ars_bookings") || "[]");
  const list = all.filter(b => b.user === user);

  const box = document.getElementById("bookingsList");
  box.innerHTML = "";

  if(list.length === 0){
    box.innerHTML = "<p class='small-text'>No bookings found.</p>";
    return;
  }

  list.reverse().forEach(b=>{
    const div = document.createElement("div");
    div.className = "ticket-box fade-in";
    div.style.marginBottom = "12px";

    div.innerHTML = `
      <div class="ticket-grid">
        <div><b>Ticket ID:</b> ${b.ticketId}</div>
        <div><b>Booked At:</b> ${b.bookedAt}</div>
        <div><b>Passenger:</b> ${b.passengerName}</div>
        <div><b>Phone:</b> ${b.phone}</div>
        <div><b>Route:</b> ${b.from} → ${b.to}</div>
        <div><b>Date:</b> ${b.date}</div>
        <div><b>Class:</b> ${b.class}</div>
        <div><b>Passengers:</b> ${b.seats}</div>
        <div class="full"><b>Total Fare:</b> ₹${b.total}</div>
      </div>
      <hr class="soft-line"/>
      <div class="ticket-bottom no-print">
        <button class="btn-outline" onclick="viewTicket('${b.ticketId}')">View Ticket</button>
        <button class="btn-primary" onclick="cancelTicket('${b.ticketId}')">Cancel Ticket</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function viewTicket(ticketId){
  const all = JSON.parse(localStorage.getItem("ars_bookings") || "[]");
  const found = all.find(x => x.ticketId === ticketId);
  if(!found){ alert("Ticket not found!"); return; }
  localStorage.setItem("ars_currentBooking", JSON.stringify(found));
  window.location.href = "confirm.html";
}

function cancelTicket(ticketId){
  if(!confirm("Are you sure to cancel this ticket?")) return;

  let all = JSON.parse(localStorage.getItem("ars_bookings") || "[]");
  all = all.filter(x => x.ticketId !== ticketId);
  localStorage.setItem("ars_bookings", JSON.stringify(all));

  alert("Ticket cancelled successfully!");
  loadMyBookings();
}