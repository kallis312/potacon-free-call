function openContactList() {
    let mobile = $('#mobilenumber').val();
    localStorage.setItem('my-phone', mobile)

}

function modalHandle() {
    $('#phoneNumber').modal()
    $('#phoneNumber').modal('open')
}

function showTime() {
    let date = new Date();
    let h = date.getHours(); // 0 - 23
    let m = date.getMinutes(); // 0 - 59
    let s = date.getSeconds(); // 0 - 59
    let session = "AM";
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    if (h == 0) {
        h = 12;
    }

    if (h > 12) {
        h = h - 12;
        session = "PM";
    }

    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;

    let time = h + ":" + m;
    let date_ = year + "年" + (month + 1) + "月" + day + '日';
    document.getElementById("MyClockDisplay").innerText = time;
    document.getElementById("MyClockDisplay").textContent = time;
    document.getElementById("MyDate").innerText = date_;
    document.getElementById("MyDate").textContent = date_;

    setTimeout(showTime, 1000);

}

function pageView(url) {
    if (localStorage.getItem('myNumber')) {
        let myContact = JSON.parse(localStorage.getItem('myNumber'))
        // location.href = 'contact-load.html?type='+type+'&user_mobile_number='+myContact.number
        url = url + myContact.number
    } else {
        url = url + 99
    }

    window.location.href = url;
}

showTime()

