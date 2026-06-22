/* -------------------------------------------------------------
   CL BARBER - JAVASCRIPT COMPORTAMENTAL PREMIUM
   Funcionalidades: Menu Hambúrguer, Efeito Scroll, Filtro de Galeria,
   e Agendamento Online Passo a Passo Integrado ao WhatsApp
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. CONTROLE DE SCROLL DO HEADER (ENCOLHIMENTO FLUIDO)
       ========================================================= */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* =========================================================
       2. MENU MOBILE DE NAVEGAÇÃO
       ========================================================= */
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileNavToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        mobileNavToggle.classList.toggle('open');
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    });

    // Fechar menu ao clicar em qualquer link de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            mobileNavToggle.classList.remove('open');
            document.body.style.overflow = 'auto';

            // Adiciona classe ativa apenas ao link clicado
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Highlight link na barra de navegação ativa com base no Scroll
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 120)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    /* =========================================================
       3. FILTROS INTERATIVOS DA GALERIA DE CORTES
       ========================================================= */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove classe ativa de todos e adiciona no selecionado
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                // Animação de fade out/in suave na filtragem
                if (category === 'all' || itemCategory === category) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    /* =========================================================
       4. AGENDAMENTO ONLINE (PASSO A PASSO)
       ========================================================= */
    const bookingForm = document.getElementById('bookingForm');
    const stepPanes = document.querySelectorAll('.booking-step-pane');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const successPane = document.getElementById('successPane');
    
    // Dados Dinâmicos do Agendamento
    let selectedServices = []; // Guarda objetos { id, title, price }
    let selectedBarber = 'Caliel Lucas';
    let selectedDate = '';
    let selectedTime = '';
    let clientName = '';
    let clientPhone = '';

    // Pré-carrega um agendamento demonstrativo de teste às 15:00 para hoje caso a memória esteja vazia
    function initMockBookings() {
        if (!localStorage.getItem('cl_barber_bookings')) {
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + 
                             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(today.getDate()).padStart(2, '0');
            const mockBookings = [
                { date: todayStr, time: '15:00' }
            ];
            localStorage.setItem('cl_barber_bookings', JSON.stringify(mockBookings));
        }
    }
    initMockBookings();

    // Função auxiliar robusta para criar um objeto Date no fuso horário local exato
    function parseLocalDatetime(dateStr, timeStr) {
        const dParts = dateStr.split('-');
        const tParts = timeStr.split(':');
        return new Date(
            parseInt(dParts[0]),
            parseInt(dParts[1]) - 1, // index do mês em JS é 0-11
            parseInt(dParts[2]),
            parseInt(tParts[0]),
            parseInt(tParts[1]),
            0
        );
    }

    // Lógica de Persistência Local e Bloqueio de Horários ocupados/passados
    function loadAndCleanupBookings() {
        const bookingsStr = localStorage.getItem('cl_barber_bookings') || '[]';
        let bookings = [];
        try {
            bookings = JSON.parse(bookingsStr);
        } catch(e) {
            bookings = [];
        }

        const now = new Date();
        // Filtra agendamentos passados (assim que passa o horário, ele sai do sistema e libera)
        bookings = bookings.filter(b => {
            const bookingDateTime = parseLocalDatetime(b.date, b.time);
            return bookingDateTime > now;
        });

        localStorage.setItem('cl_barber_bookings', JSON.stringify(bookings));
        return bookings;
    }

    function updateAvailableTimeSlots() {
        if (!selectedDate) {
            timeSlots.forEach(slot => {
                slot.classList.remove('active', 'booked', 'past');
                slot.style.pointerEvents = 'none';
                slot.style.opacity = '0.5';
            });
            return;
        }

        const bookings = loadAndCleanupBookings();
        const now = new Date();

        timeSlots.forEach(slot => {
            const slotTime = slot.getAttribute('data-time');
            const slotDateTime = parseLocalDatetime(selectedDate, slotTime);

            // Resetar estados
            slot.classList.remove('booked', 'past');
            slot.style.pointerEvents = 'auto';
            slot.style.opacity = '1';

            if (slotDateTime < now) {
                // Horário no passado (já passou do horário atual no mesmo dia)
                slot.classList.add('past');
                slot.style.pointerEvents = 'none';
                slot.style.opacity = '0.4';
                if (selectedTime === slotTime) {
                    selectedTime = '';
                    slot.classList.remove('active');
                }
            } else {
                // Verificar se o horário já está ocupado por outra pessoa
                const isBooked = bookings.some(b => b.date === selectedDate && b.time === slotTime);
                if (isBooked) {
                    slot.classList.add('booked');
                    slot.style.pointerEvents = 'none';
                    slot.style.opacity = '0.4';
                    if (selectedTime === slotTime) {
                        selectedTime = '';
                        slot.classList.remove('active');
                    }
                }
            }
        });

        validateStep3();
    }

    // Impedir data passada no calendário
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // --- PASSO 1: SELEÇÃO DE SERVIÇOS ---
    const serviceCards = document.querySelectorAll('.service-checkbox-card');
    const bookingTotalVal = document.getElementById('bookingTotalVal');
    const btnNext1 = document.getElementById('btnNext1');

    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const serviceId = card.getAttribute('data-service-id');
            const serviceTitle = card.getAttribute('data-title');
            const servicePrice = parseFloat(card.getAttribute('data-price'));

            card.classList.toggle('active');

            if (card.classList.contains('active')) {
                // Adiciona o serviço selecionado
                selectedServices.push({
                    id: serviceId,
                    title: serviceTitle,
                    price: servicePrice
                });
            } else {
                // Remove o serviço desselecionado
                selectedServices = selectedServices.filter(s => s.id !== serviceId);
            }

            // Calcula total e gerencia botão Avançar
            updateServicesTotal();
        });
    });

    function updateServicesTotal() {
        const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
        bookingTotalVal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Habilita avançar apenas se tiver pelo menos 1 serviço
        if (selectedServices.length > 0) {
            btnNext1.disabled = false;
        } else {
            btnNext1.disabled = true;
        }
    }

    // --- PASSO 2: SELEÇÃO DE BARBEIRO ---
    const barberCards = document.querySelectorAll('.barber-select-card');
    const btnBack2 = document.getElementById('btnBack2');
    const btnNext2 = document.getElementById('btnNext2');

    barberCards.forEach(card => {
        card.addEventListener('click', () => {
            barberCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedBarber = card.getAttribute('data-barber');
        });
    });

    // --- PASSO 3: DATA E HORA ---
    const timeSlots = document.querySelectorAll('.time-slot');
    const btnBack3 = document.getElementById('btnBack3');
    const btnNext3 = document.getElementById('btnNext3');

    // Inicializar slots de horários com base no estado atual
    updateAvailableTimeSlots();

    dateInput.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        selectedTime = '';
        timeSlots.forEach(s => s.classList.remove('active'));
        updateAvailableTimeSlots();
    });

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            if (slot.classList.contains('booked') || slot.classList.contains('past')) {
                return; // Bloqueia clique caso esteja ocupado ou no passado
            }
            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            selectedTime = slot.getAttribute('data-time');
            validateStep3();
        });
    });

    function validateStep3() {
        if (selectedDate && selectedTime) {
            btnNext3.disabled = false;
        } else {
            btnNext3.disabled = true;
        }
    }

    // --- PASSO 4: RESUMO E CONFIRMAÇÃO ---
    const btnBack4 = document.getElementById('btnBack4');
    const btnFinish = document.getElementById('btnFinish');
    
    const summaryServices = document.getElementById('summaryServices');
    const summaryBarber = document.getElementById('summaryBarber');
    const summaryDateTime = document.getElementById('summaryDateTime');
    const summaryTotal = document.getElementById('summaryTotal');

    function populateSummary() {
        summaryServices.innerText = selectedServices.map(s => s.title).join(', ');
        summaryBarber.innerText = selectedBarber;
        
        // Formatar data em PT-BR
        const dateParts = selectedDate.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        summaryDateTime.innerText = `${formattedDate} às ${selectedTime}h`;

        const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
        summaryTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // --- LÓGICA DE CONTROLE DE PASSOS (STEPS) ---
    function goToStep(stepNumber) {
        stepPanes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // Atualizar indicadores de passos no topo
        stepIndicators.forEach(ind => {
            const indStep = parseInt(ind.getAttribute('data-step'));
            if (indStep === stepNumber) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else if (indStep < stepNumber) {
                ind.classList.remove('active');
                ind.classList.add('completed');
            } else {
                ind.classList.remove('active');
                ind.classList.remove('completed');
            }
        });
    }

    // Listeners de botões para navegação de passos
    btnNext1.addEventListener('click', () => goToStep(2));
    
    btnBack2.addEventListener('click', () => goToStep(1));
    btnNext2.addEventListener('click', () => goToStep(3));

    btnBack3.addEventListener('click', () => {
        goToStep(2);
    });
    btnNext3.addEventListener('click', () => {
        populateSummary();
        goToStep(4);
    });

    btnBack4.addEventListener('click', () => goToStep(3));

    // --- FINALIZAÇÃO E GERAÇÃO DE TICKET ---
    btnFinish.addEventListener('click', () => {
        const inputName = document.getElementById('clientName');
        const inputPhone = document.getElementById('clientPhone');

        if (!inputName.value.trim() || !inputPhone.value.trim()) {
            alert('Por favor, preencha seu nome e celular para gerar o agendamento.');
            return;
        }

        clientName = inputName.value.trim();
        clientPhone = inputPhone.value.trim();

        // Guardar o horário selecionado antes de atualizar e limpar os slots
        const bookedTime = selectedTime;

        // Salvar agendamento no localStorage para indisponibilizar o horário
        const bookings = loadAndCleanupBookings();
        bookings.push({ date: selectedDate, time: bookedTime });
        localStorage.setItem('cl_barber_bookings', JSON.stringify(bookings));

        // Atualizar visual dos slots
        updateAvailableTimeSlots();

        // Ocultar formulário de agendamento e mostrar ticket virtual
        bookingForm.style.display = 'none';
        successPane.classList.add('active');

        // Preencher ticket
        const ticketId = `CL-${Math.floor(1000 + Math.random() * 9000)}`;
        document.getElementById('ticketCode').innerText = `#${ticketId}`;
        document.getElementById('ticketClientName').innerText = clientName;
        document.getElementById('ticketBarberName').innerText = selectedBarber;

        const dateParts = selectedDate.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        document.getElementById('ticketDate').innerText = formattedDate;
        document.getElementById('ticketTime').innerText = `${bookedTime}h`;
        
        const servicesText = selectedServices.map(s => s.title).join(', ');
        document.getElementById('ticketServices').innerText = servicesText;

        const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
        document.getElementById('ticketTotalAmount').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Salvar os dados para o redirecionamento do WhatsApp
        setupWhatsAppAction(ticketId, formattedDate, servicesText, total, bookedTime);
    });

    // --- INTEGRAÇÃO COM WHATSAPP ---
    function setupWhatsAppAction(ticketId, formattedDate, servicesText, total, bookedTime) {
        const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
        
        btnSendWhatsApp.onclick = () => {
            const numeroTelefone = '554185307601'; // Número oficial da barbearia Caliel Lucas
            
            // Mensagem elegante e formatada com quebras de linha e Emojis
            const mensagem = encodeURIComponent(
`💈 *AGENDAMENTO CL BARBER* 💈
----------------------------------
📌 *Ticket:* #${ticketId}
👤 *Cliente:* ${clientName}
📞 *WhatsApp:* ${clientPhone}
💇‍♂️ *Serviço(s):* ${servicesText}
💈 *Barbeiro:* ${selectedBarber}
📅 *Data:* ${formattedDate}
⏰ *Horário:* ${bookedTime}h
----------------------------------
💰 *Total Estimado:* R$ ${total.toFixed(2).replace('.', ',')}

Olá, gostaria de confirmar este agendamento que realizei no site da barbearia!`
            );

            // Abre o WhatsApp com a mensagem pronta
            const url = `https://wa.me/${numeroTelefone}?text=${mensagem}`;
            window.open(url, '_blank');
        };
    }

    // --- RESET DO FORMULÁRIO DE AGENDAMENTO ---
    const btnResetBooking = document.getElementById('btnResetBooking');
    btnResetBooking.addEventListener('click', () => {
        // Limpar variáveis
        selectedServices = [];
        selectedBarber = 'Caliel Lucas';
        selectedDate = '';
        selectedTime = '';
        clientName = '';
        clientPhone = '';

        // Resetar HTML
        bookingForm.reset();
        serviceCards.forEach(card => card.classList.remove('active'));
        barberCards.forEach((c, idx) => {
            if (idx === 0) c.classList.add('active');
            else c.classList.remove('active');
        });
        timeSlots.forEach(s => s.classList.remove('active'));
        dateInput.value = '';
        updateServicesTotal();

        // Voltar visual
        successPane.classList.remove('active');
        bookingForm.style.display = 'block';
        goToStep(1);
    });

});
