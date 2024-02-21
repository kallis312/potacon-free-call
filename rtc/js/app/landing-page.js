function openContactList() {
    let mobile = $('#mobilenumber').val();
    localStorage.setItem('my-phone', mobile)

}

function modalHandle() {
    $('#phoneNumber').modal()
    $('#phoneNumber').modal('open')
}

/**
 * get the day name
 *
 * @param day_number
 * @returns {{Sun: string}|{Mon: string}|{Tue: string}|{Wed: string}|{Thu: string}}
 */
const getDayName = (day_number) => {
    const days = [
        {"Sun": "日"},
        {"Mon": "月"},
        {"Tue": "火"},
        {"Wed": "水"},
        {"Thu": "木"},
        {"Fri": "金"},
        {"Sat": "土"}
    ];
    return days[day_number];
}
function showTime() {
    let date = new Date();
    let h = date.getHours(); // 0 - 23
    let m = date.getMinutes(); // 0 - 59
    let s = date.getSeconds(); // 0 - 59
    let session = "AM";
    let day_name= getDayName(date.getDay())
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    // Add this line
    //let twoDigitYear = year.toString().substring(2);

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
    //let date_ = year + "年" + (month + 1) + "月" + day + '日';
    let date_ = `${year}.${month + 1}.${day}`;
    document.getElementById("MyClockDisplay").innerText = time;
    document.getElementById("MyClockDisplay").textContent = time;
    document.getElementById("MyDate").innerText = date_;
    document.getElementById("MyDate").textContent = date_;

    setTimeout(showTime, 1000);

}

function pageView(url,from) {
    // if (localStorage.getItem('myNumber')) {
    //     let myContact = JSON.parse(localStorage.getItem('myNumber'))
    //     // location.href = 'contact-load.html?type='+type+'&user_mobile_number='+myContact.number
    //     url = url + myContact.number
    // } else {
    //     url = url + 99
    // }
    //
    // window.location.href = url;

    if (localStorage.getItem('myNumber')) {
        let myContact = JSON.parse(localStorage.getItem('myNumber'));
        // location.href = 'contact-load.html?type='+type+'&user_mobile_number='+myContact.number
        if(from!=0)
            url = url + myContact.number+'&type='+from; //from=1 for company contacts; from=2 for personal contacts
        else
            url = url + myContact.number; //from=1 for company contacts; from=2 for personal contacts
    } else {
        url = url + 99;
    }

    window.location.href = url;
}

showTime()


/**
 * user calling mode check and system showing and hide
 *
 * @type {string}
 */
/*let userCallingMode                                                = localStorage.getItem("userCallingMode")
document.getElementById("free-call-for-web").style.display         = "none";
document.getElementById("user-calling-mode").style.backgroundColor = "#85C9E8";
if (userCallingMode === 'web-free-call') {
    document.getElementById("free-call-for-web").style.display         = "block";
    document.getElementById("call-for-mobile-sim").style.display       = "none";
    document.getElementById("user-calling-mode").innerText             = "通常の通話";
    document.getElementById("user-calling-mode").style.backgroundColor = "#00B050";
    let element = document.getElementById("button-section");
    element.classList.add('button-section');
} else if (userCallingMode === 'mobile-sim') {
    document.getElementById("user-calling-mode").innerText = "無料通話";
}*/

/**
 * Open then free alert calling modal
 */
const openFreeCallingAlertModal = () => {
    if (localStorage.getItem('call_mode') === 'free_call') {
        localStorage.setItem('call_mode', 'mobile_call')
    } else {
        localStorage.setItem('call_mode', 'free_call')
    }
    $('#free-call-alert-modal').modal();
    $('#free-call-alert-modal').modal('open');
}

