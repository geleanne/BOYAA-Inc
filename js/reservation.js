document.addEventListener('DOMContentLoaded', function() {
    const reservationDateInput = document.getElementById('reservationDate');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const selectedTimeInput = document.getElementById('selectedTime');
    const startTimeHiddenInput = document.getElementById('startTime');
    const endTimeHiddenInput = document.getElementById('endTime');
    const durationDisplay = document.getElementById('durationDisplay'); // Display field for duration
    const durationHiddenInput = document.getElementById('duration'); // Hidden field for actual duration value
    const reservationForm = document.getElementById('reservationForm');
    const bookingConfirmation = document.getElementById('bookingConfirmation');

    let selectedSlots = []; // Array to store selected time slot elements (buttons)

    // Current time in Manila (Philippines) as provided
    const now = new Date("2025-06-03T19:47:59"); // June 3, 2025 at 7:47:59 PM PST
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Initialize Flatpickr for the date input
    const fp = flatpickr(reservationDateInput, {
        dateFormat: "Y-m-d",
        minDate: today, // Cannot select dates before today
        maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6), // Limit to today + 6 days (total 7 days)
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                selectedDateDisplay.textContent = new Date(selectedDates[0]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                generateTimeSlots(selectedDates[0]); // Pass the Date object
            } else {
                selectedDateDisplay.textContent = "No date selected";
                resetTimeSlotSelection();
                timeSlotsContainer.innerHTML = `
                    <div class="alert alert-info w-100 text-center mb-0" role="alert">
                        Please select a date to see available time slots.
                    </div>
                `;
            }
        }
    });

    // Function to generate dummy time slots
    function generateTimeSlots(selectedDateObj) {
        // All possible 1-hour slots from 6:00 PM to 10:00 PM
        // Store them with a unique numerical value for ordering/comparison
        const allSlots = [
            { id: 18, start: "06:00 PM", end: "07:00 PM" }, // 18:00
            { id: 19, start: "07:00 PM", end: "08:00 PM" }, // 19:00
            { id: 20, start: "08:00 PM", end: "09:00 PM" }, // 20:00
            { id: 21, start: "09:00 PM", end: "10:00 PM" }  // 21:00
        ];

        const isSelectedDateToday = selectedDateObj.toDateString() === today.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        timeSlotsContainer.innerHTML = ''; // Clear previous slots
        resetTimeSlotSelection(); // Reset any previous selections

        let slotsAvailable = false;

        allSlots.forEach(slot => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'time-slot-btn', 'm-1');
            button.textContent = `${slot.start}`; // Only show start time for cleaner buttons
            button.dataset.startTime = convertTo24Hour(slot.start);
            button.dataset.endTime = convertTo24Hour(slot.end);
            button.dataset.id = slot.id; // Store the unique ID

            let isUnavailable = false;

            if (isSelectedDateToday) {
                // If it's today, check if the slot has already passed
                const slotStartHour = parseInt(button.dataset.startTime.split(':')[0]);
                const slotStartMinute = parseInt(button.dataset.startTime.split(':')[1]);

                // Consider a small buffer, e.g., 15 minutes before the hour
                if (slotStartHour < currentHour || (slotStartHour === currentHour && slotStartMinute <= currentMinute + 15)) {
                    isUnavailable = true;
                }
            }

            // Simulate some randomly unavailable slots for future dates
            const randomFactor = selectedDateObj.getDate() + selectedDateObj.getMonth();
            if (!isUnavailable && (randomFactor % 3 === 0 && slot.start === "07:00 PM")) {
                isUnavailable = true;
            } else if (!isUnavailable && (randomFactor % 5 === 0 && slot.start === "09:00 PM")) {
                 isUnavailable = true;
            }

            if (isUnavailable) {
                button.classList.add('unavailable-slot');
                button.disabled = true;
            } else {
                slotsAvailable = true;
                button.addEventListener('click', () => handleTimeSlotClick(button));
            }
            timeSlotsContainer.appendChild(button);
        });

        if (!slotsAvailable) {
            timeSlotsContainer.innerHTML = `
                <div class="alert alert-warning w-100 text-center mb-0" role="alert">
                    No available time slots for this date. Please choose another date.
                </div>
            `;
        }
    }

    // Handles logic for clicking time slots (multi-selection)
    function handleTimeSlotClick(clickedButton) {
        // If the clicked slot is already selected, deselect it and subsequent slots
        if (selectedSlots.includes(clickedButton)) {
            const index = selectedSlots.indexOf(clickedButton);
            for (let i = index; i < selectedSlots.length; i++) {
                selectedSlots[i].classList.remove('selected-slot');
            }
            selectedSlots = selectedSlots.slice(0, index); // Keep only slots before the deselected one
        } else {
            // Check if this is the first slot being selected
            if (selectedSlots.length === 0) {
                selectedSlots.push(clickedButton);
                clickedButton.classList.add('selected-slot');
            } else {
                // Check if the clicked slot is consecutive to the last selected slot
                const lastSelectedId = parseInt(selectedSlots[selectedSlots.length - 1].dataset.id);
                const clickedId = parseInt(clickedButton.dataset.id);

                if (clickedId === lastSelectedId + 1 && selectedSlots.length < 3) { // Max 3 hours
                    // Check if the slot is truly available (not disabled) before selecting
                    if (!clickedButton.classList.contains('unavailable-slot')) {
                        selectedSlots.push(clickedButton);
                        clickedButton.classList.add('selected-slot');
                    }
                } else if (clickedId < lastSelectedId) {
                    // If a user clicks an earlier slot while some are selected,
                    // assume they want to restart selection from this point or shorten
                    resetTimeSlotSelection();
                    selectedSlots.push(clickedButton);
                    clickedButton.classList.add('selected-slot');
                } else if (selectedSlots.length >= 3) {
                    alert('You can select a maximum of 3 consecutive hours.');
                }
            }
        }

        updateSelectedTimeAndDuration();
    }

    // Updates the displayed selected time range and calculated duration
    function updateSelectedTimeAndDuration() {
        if (selectedSlots.length > 0) {
            // Sort selected slots by their ID to ensure correct order
            selectedSlots.sort((a, b) => parseInt(a.dataset.id) - parseInt(b.dataset.id));

            const firstSlot = selectedSlots[0];
            const lastSlot = selectedSlots[selectedSlots.length - 1];

            // Get the start time of the first selected slot
            const actualStartTime = firstSlot.dataset.startTime;
            // Get the end time of the last selected slot (which is the end of the last selected hour)
            const actualEndTime = lastSlot.dataset.endTime;

            selectedTimeInput.value = `${formatTime(actualStartTime)} - ${formatTime(actualEndTime)}`;
            startTimeHiddenInput.value = actualStartTime;
            endTimeHiddenInput.value = actualEndTime;

            const calculatedDuration = selectedSlots.length;
            durationDisplay.value = calculatedDuration;
            durationHiddenInput.value = calculatedDuration; // Update hidden field for form submission
            durationDisplay.classList.remove('is-invalid'); // Clear validation if present
        } else {
            selectedTimeInput.value = '';
            startTimeHiddenInput.value = '';
            endTimeHiddenInput.value = '';
            durationDisplay.value = '0';
            durationHiddenInput.value = '0';
        }
        validateDuration(); // Re-validate duration after update
    }

    // Formats 24-hour time to 12-hour AM/PM for display
    function formatTime(time24h) {
        const [hours, minutes] = time24h.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }

    // Resets all time slot selections and related inputs
    function resetTimeSlotSelection() {
        selectedSlots.forEach(button => button.classList.remove('selected-slot'));
        selectedSlots = [];
        selectedTimeInput.value = '';
        startTimeHiddenInput.value = '';
        endTimeHiddenInput.value = '';
        durationDisplay.value = '0';
        durationHiddenInput.value = '0';
        durationDisplay.classList.remove('is-invalid');
    }

    // Helper to convert 12-hour time to 24-hour time
    function convertTo24Hour(time12h) {
        const [time, period] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (period && period.toUpperCase() === 'PM' && hours !== '12') {
            hours = parseInt(hours, 10) + 12;
        } else if (period && period.toUpperCase() === 'AM' && hours === '12') {
            hours = '00';
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    function validateDuration() {
        const currentDuration = parseInt(durationHiddenInput.value);
        if (currentDuration === 0) {
            durationDisplay.classList.add('is-invalid'); // Add visual cue for invalid duration
            return false;
        }
        durationDisplay.classList.remove('is-invalid');
        return true;
    }


    reservationForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // Manual validation for duration and selected slots
        if (!validateDuration()) {
            alert('Please select at least one time slot.');
            return;
        }

        const courtType = document.getElementById('courtType').value;
        const reservationDate = reservationDateInput.value;
        const selectedSlotText = selectedTimeInput.value;
        const duration = durationHiddenInput.value; // Get value from the hidden input

        if (!courtType || !reservationDate || !selectedSlotText || !duration || parseInt(duration) === 0) {
            alert('Please ensure all reservation details are filled and time slot(s) selected.');
            return;
        }

        console.log('Booking details:', { courtType, reservationDate, selectedSlotText, duration });

        document.getElementById('confirmCourtType').textContent = courtType.charAt(0).toUpperCase() + courtType.slice(1);
        document.getElementById('confirmDate').textContent = new Date(reservationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('confirmTime').textContent = selectedSlotText;
        document.getElementById('confirmDuration').textContent = duration;

        bookingConfirmation.style.display = 'block';
        bookingConfirmation.classList.add('show');

        // Reset form and UI elements
        reservationForm.reset();
        resetTimeSlotSelection(); // Reset all time slot related fields
        selectedDateDisplay.textContent = "No date selected";
        timeSlotsContainer.innerHTML = `
            <div class="alert alert-info w-100 text-center mb-0" role="alert">
                Please select a date to see available time slots.
            </div>
        `;

        bookingConfirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});