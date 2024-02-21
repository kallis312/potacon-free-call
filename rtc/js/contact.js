/*if (localStorage.getItem('call_mode') === 'free_call') {
    $('#free_call_btn').hide()
}
*/
$('#free_call_btn').hide();


document.addEventListener('DOMContentLoaded', function (e) {
    document.addEventListener('scroll', function (e) {
        let documentHeight = document.body.scrollHeight;
        let currentScroll  = window.scrollY + window.innerHeight;
        let innerHeight    = window.innerHeight;
        let modifier       = 100;
        if (innerHeight + modifier < currentScroll) {
            reload_status = true;
        } else {
            reload_status = false;
        }
    })
})

function pageView(url,from) {
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
let type = getParameterByName('type');
if (type==1){
    $('#contact_type_personal').hide();
    $('#contact_type_company').show();
}else {
    $('#contact_type_personal').show();
    $('#contact_type_company').hide();
}
if (type !== 'per') { //personal contact check
    // $('#contact-load-button').hide()
}
$('#contacts-search-form').hide();
/**
 * update contacts in local storage data
 */
updatingLocalStorageContact(urlParam('type'))

/**
 * showing contacts by type (Personal or Company)
 */
function showingContacts() {
    if (urlParam('type') == 2) { //personal contacts
        if (localStorage.getItem("personal_contacts_by_user") !== null) {
            let personal_contacts = JSON.parse(localStorage.getItem("personal_contacts_by_user"));
            showingContactsListHtml(personal_contacts)
        }
    } else if (urlParam('type') == 1) {
        if (localStorage.getItem("company_contacts_by_user") !== null) {
            let company_contacts = JSON.parse(localStorage.getItem("company_contacts_by_user"));
            showingContactsListHtml(company_contacts)
        }
    }
}

/**
 * showing contacts html dom by type (Personal or Company)
 *
 * @param contacts
 */
function showingContactsListHtml(contacts) {
    if (contacts.length > 0) {
        
        let html = '';
        html
            += `<div class="row" style="margin-bottom: 0px; display: none"> <div class="col s12"><input onclick="checkAllContacts(this);" style="pointer-events:auto !important; margin-top: 5px;" type="checkbox" name="check_all_contacts" id="check_all_contacts" value="check-all"><br> <img onclick="messagePotaconLink(\'send-link-to-all\')" hspace="50" src="./rsc/pwa-icon/icon_send.png" alt="" style="display: none; cursor: pointer;width: 25px; height: 25px; border: 1px solid #e6e6e6; border-radius:10px;"></div></div>`;
            // <div data-tel="${cont.mobile_number}" class="col s1 make-call-to-phone" style="margin-top: 10px;padding-left: 7px;padding-bottom: 0px">
            // <input style="pointer-events:auto !important;" type="checkbox" name="contact_select" id="${cont.mobile_number}" value="${cont.mobile_number}">
            // </div>
        //     <div onclick="callingAlertModal(this)" data-id="${cont.id}" data-tel="${cont.mobile_number}" data-name="${cont.name}" class="waves-effect waves-light btn-large col s3 make-call-to-phone" id="message_potacon_link" style=" font-size: 22px;height: 100%;line-height: 33px;float: right;padding: 5px">
        //     <span>修正</span>
        // </div>
        // col s8 
        contacts.map(function (cont) {
            html += `<div id="contact_list_${cont.id}" class="contact-row" >
                                  
                                     <div onclick="callingAlertModal(this)" data-id="${cont.id}" data-tel="${cont.mobile_number}" data-name="${cont.name}" class="make-call-to-phone" style="position: relative;cursor: pointer ;width:100%">
                                    <div class="contact-name">${cont.name}</div>
                                    <div class="contact-number" id="${cont.mobile_number}">${cont.mobile_number}</div>
                                    </div>
                                  
                                    </div>`
        })

        $('#contact-list-view').html(html);
    }
    // else {
    //     let htmls = '';
    //     htmls+=`<div id="historyModal" class="modal" style="max-width: 300px">
    //     <div class="modal-content center" style="padding: 0px 13px 17px">
    //         <h5>データがありません </h5>
    //         <hr style="border: 1px solid #1cb8ee">
    //         <h5>メインに戻ります</h5>
    //         <img style="cursor: pointer;" onclick="modalclose()" src="../images/4.png">
    //     </div>
    // </div>`
    //     $('#contact-list-view').html(htmls);
    // }

}

$("#contacts-search-form").submit(function(e) {
    e.preventDefault();
    let search_text = $('#contacts_search_text').val();
    updatingLocalStorageContact(urlParam('type'), search_text)
});
/**
 * Updating local storage contacts data
 *
 * @param type
 */



function updatingLocalStorageContact(type = 2, search_text= '') {
    if(type==3){
        $('#contacts-search-form').show()
    }
    //var myID = urlParam('user_mobile_number');
    var jacosUserId = localStorage.getItem('jacosUserId');
    var myID        = localStorage.getItem('auth_id');
    if (myID != null) {
        $.get(`${apiUrl}/get_all_users/${myID}/${type}`, {
            search_text: search_text
        }, function (data) {
            if (data.length > 0 || type == 3) {
                $.get(`${apiUrl}/call-history-all/${myID}`, function (dataa) {
                    if (Array.isArray(dataa.histories)) {
                        const filteredData = data.filter(test => 
                            dataa.histories.every(show => show.mobile_number !== test.mobile_number)
                        );
                        console.log("data show",data,filteredData);
                        // Now 'filteredData' contains the data objects that have different mobile numbers compared to 'dataa'
                        // You can do something with this filtered data
                    } else {
                        console.error("API response for call-history-all is not an array:", dataa);
                    }
                });
                showingContactsListHtml(data)
            } else {
                $.get(`${apiUrl}/get_all_contacts/${jacosUserId}`, {}, function (data) {
                    showingContactsListHtml(data.contacts)
                });
            }
        });


    }
}

/**
 * formatting the contacts
 *
 * @param personal_contacts
 */
const formattingContacts     = (personal_contacts) => {
    return personal_contacts.map((contact, index) => {
        return {
            "contact_owner" : localStorage.getItem('auth_id'),
            "contact_name"  : contact.name.length > 0 ? contact.name[0] : '',
            "contact_telnum": contact.tel.length > 0 ? contact.tel[0] : '',
            //"contact_mail"  : contact.email.length > 0 ? contact.email[0] : '',
            "contact_group_flag"  : contact.contact_group_flag && contact.contact_group_flag.length > 0 ? contact.contact_group_flag[0]: urlParam('type')
        }
    })
}
/**
 * update or create then contacts by user
 *
 * @param personal_contacts
 */
const updateOrCreateContacts = (personal_contacts) => {
    $.ajax({
        dataType   : 'json',
        contentType: 'application/json',
        processData: false,
        type       : "POST",
        url        : `${apiUrl}/add_contacts/${localStorage.getItem('jacosUserId')}`,
        data       : JSON.stringify(formattingContacts(personal_contacts)),
        success    : function (res) {
            console.log('add_contacts_res', res)
            //callingInModal(personal_contacts)
            updatingLocalStorageContact(urlParam('type'))
            contactManageModalClose()
            window.location.reload()
        },
        error      : function (errordata) {
            console.log(errordata, 'errordata');
        }
    });
}



let tel = '';
let getContact = document.getElementById('get-contact-list')
getContact.addEventListener('click', async () => {
    console.log('contact list event listener')
    /*let user_contacts = [
        {
            "email": [],
            "name" : ["Queen O'Hearts"],
            "tel"  : ["+1-206-555-1000", "+1-206-555-1111"]
        },
        {
            "email": [],
            "name" : ["Queen O'Hearts 22 "],
            "tel"  : ["+1-206-555-1000 222", "+1-206-555-1111 2222"]
        }
    ]
    contactManage(user_contacts)
    return false;*/
    // We are unsure if addresses are supported, or can be provided by the browser.
    try {
        const user_contacts = await navigator.contacts.select(['name', 'tel'], {multiple: true});
        if (!user_contacts.length) {
            // No contacts were selected in the picker.
            return;
        }
        //update or create contacts
        contactManage(user_contacts)
        //updateOrCreateContacts(user_contacts)
    } catch (e) {
        alert(e)
        swal("この機能は、Android Chrome80およびChrome80以降でのみ使用できます", {
            buttons: {
                catch: {
                    text: "戻る",
                    value: "catch",
                }
            },
            allowOutsideClick: false,
            closeOnClickOutside: false
        })
            .then((value) => {
                switch (value) {
                    case "catch":
                        swal.close();
                        break;
                }
            });
        // alert(e.message)
        console.log("Unexpected error happened in Contact Picker API");
    }
    // Fallback to a form.
});

//contactLoadFromStorage();

// ownNumberRegistrationCheck();

// contact manage from submit
$('#contactManageForm').submit(function (e) {
    e.preventDefault();
    let personal_contacts = [];

    $('.contact_name').each(function (index, element) {
        personal_contacts.push({
            "name"              : [$(this).val()],
            "tel"               : [$(this).next().val()],
            "contact_group_flag": [$(this).closest('.row').find(":radio:checked").val()]
        })
    });
    updateOrCreateContacts(personal_contacts)
});

/**
 * contact manage from modal hide
 */
function contactManageModalClose() {
    $('#contactManageModal').modal('close');
}

/**
 * contact manage from modal show then form submit
 * @param user_contacts
 */
function contactManage(user_contacts) {
    $('#contactManageModal').modal();
    $('#contactManageModal').modal('open');
    let html = '';
    formattingContacts(user_contacts).forEach(async (contact, index) => {
        html += ` <div class="row" style="border-bottom: 1px solid #897474; margin-bottom: 7px;">
                    <div class="col s4 l4 " style="margin-top: 17px; padding: 4px">
                       ${contact.contact_name}
                    </div>
                    <div class="col s5 l5 " style="margin-top: 17px; padding: 4px">
                        ${contact.contact_telnum}
                    </div> 
                    <div class="col s3 l3 " style=" padding: 4px">
                     <input type="hidden" class="contact_name" name="contact_name[]" value="${contact.contact_name}">
                    <input type="hidden" class="contact_telnum" name="contact_telnum[]" value="${contact.contact_telnum}"> 
                   <label class="radio-container">個
                      <input checked required class="contact_group_flag" name="contact_group_flag-${index}" value="1" type="radio" name="radio">
                      <span class="checkmark"></span>
                    </label>
                    <label class="radio-container">会
                      <input required class="contact_group_flag" name="contact_group_flag-${index}" value="2" type="radio" name="radio">
                      <span class="checkmark"></span>
                    </label> 
                    </div>
                </div>`;
    });
    $('#contactManageModal').find('.modal-content').html(html);
}

/**
 * contact update from modal show then form submit
 * @param e
 */
const contactTypeUpdate = (e) => {
    let mobile_number = $(e).attr('data-tel');
    let name          = $(e).attr('data-name');
    let contact_id    = $(e).attr('data-contact_id');
    let current_flag  = urlParam('type');
    $('#contactUpdateModal').modal();
    $('#contactUpdateModal').modal('open');
    let html = ` <div class="row" style="border-bottom: 1px solid #897474; margin-bottom: 7px;">
                    <div class="col s4 l4 " style="margin-top: 17px; padding: 4px">
                       ${name}
                    </div>
                    <div class="col s5 l5 " style="margin-top: 17px; padding: 4px">
                        ${mobile_number}
                    </div> 
                    <div class="col s3 l3 " style=" padding: 4px">
                     <input type="hidden" class="contact_id" name="contact_id" value="${contact_id}"> 
                   <label class="radio-container">個
                      <input ${current_flag == 1 ? 'checked' : ''} required class="contact_group_flag" name="contact_group_flag-update" value="1" type="radio" name="radio">
                      <span class="checkmark"></span>
                    </label>
                    <label class="radio-container">会
                      <input ${current_flag == 2 ? 'checked' : ''} required class="contact_group_flag" name="contact_group_flag-update" value="2" type="radio" name="radio">
                      <span class="checkmark"></span>
                    </label> 
                    </div>
                </div>`;
    $('#contactUpdateModal').find('.modal-content').html(html);
}

$('#contactUpdateForm').submit(function (e) {
    e.preventDefault();
    let flag       = $('#contactUpdateForm').find(":radio:checked").val();
    let contact_id = $('#contactUpdateForm').find('.contact_id').val();
    $.ajax({
        type       : "POST",
        url        : `${apiUrl}/update_contact/${contact_id}`,
        dataType   : 'text',
        contentType: "application/x-www-form-urlencoded",
        data       : {
            flag: flag,
        },
        success    : function (res) {
            contactUpdateModalClose()
            window.location.reload()
        },
        error      : function (errordata) {
            console.log(errordata, 'errordata');
        }
    });
});

function contactUpdateModalClose() {
    $('#contactUpdateModal').modal('close');
}


$('input.example').on('change', function() {
    $('input.example').not(this).prop('checked', false);
});


const contactTypeChange = () => {
    let flag;
    let msg;
    if (urlParam('type') == 2) {
        flag = 1
        msg  = `<br>個人用へ移動されました。`
    } else {
        flag = 2
        msg  = `<br>会社用へ移動されました。`
    }
    $.ajax({
        type       : "POST",
        url        : `${apiUrl}/update_contact/${selected_contact_id}`,
        dataType   : 'text',
        contentType: "application/x-www-form-urlencoded",
        data       : {flag},
        success    : function (res) {
            successAlertModal(msg)
            //window.location.reload()
        },
        error      : function (errordata) {
            console.log(errordata, 'errordata');
        }
    });
}
const successAlertModal = (msg) => {
    document.getElementById(`contact_list_${selected_contact_id}`).style.display='none'
    selected_contact_modal_close()
    $('#free-call-alert-modal').modal();
    $('#free-call-alert-modal').modal('open');
    document.getElementById("contact_change_msg").innerHTML = `${selected_contact_name} ${msg}`;
    setTimeout(() => {
        $('#free-call-alert-modal').modal('close');
    }, 3000)
}
const goToContactEdit = () => {
    pageView(`edit-contact.html?contact_id=${selected_contact_id}&user_mobile_number=`,'0')
}
const goToMobileCall = () => {
    // viewCallOption();
    //  if (localStorage.getItem('call_mode') === 'free_call') {
    //      viewCallOption()
    //  } else {
         window.location.href = 'tel:' + selected_contact_number
    //  }

}
const selected_contact_modal_close = () => {
    $('#selected_contact_modal').modal('close');
}
const contactDelete = () => {
    swal(`${selected_contact_name} さんを 削除しますか？`, {
        buttons: {
            catch91: {
                text: "はい",
                value: "catch19",
            },
            catch192: {
                text: "いいえ",
                value: "catch29",
            },

        },
        allowOutsideClick: false,
        closeOnClickOutside: false
    })
        .then((value) => {
            switch (value) {
                case "catch19":
                    $.ajax({
                        type       : "DELETE",
                        url        : `${apiUrl}/delete_contact/${selected_contact_id}`,
                        dataType   : 'text',
                        contentType: "application/x-www-form-urlencoded",
                        success    : function (res) {
                           let data = JSON.parse(res);
                            if (data.status === 'success') {
                                successAlertModal(`<br>削除されました`)
                            }
                        },
                        error      : function (errordata) {
                            console.log(errordata, 'errordata');
                        }
                    });
                case "catch29":
                    swal.close();
                    break;
            }
        });
}
function messagePotaconLink(e) {
//        alert(e);
    var checked_contact_numbers='';
    if(e=='send-link-to-all'){
        $("input:checkbox[name=contact_select]:checked").each(function(){
            //console.log($(this).val());
            checked_contact_numbers +=$(this).val()+',';
//                contact_numbers_array.push($(this).val());
        });
        console.log(checked_contact_numbers);
        var callingNumber =checked_contact_numbers;
    }else{
        var callingNumber = $(e).attr('data-tel');
        console.log(callingNumber);
        var receiver_name = $(e).attr('data-name');

    }

    swal("ポタコンのアイコンを送信しますか？", {
        buttons: {
            catch91: {
                text: "はい",
                value: "catch19",
            },
            catch192: {
                text: "いいえ",
                value: "catch29",
            },

        },
        allowOutsideClick: false,
        closeOnClickOutside: false
    })
        .then((value) => {
            switch (value) {
                case "catch19":
                    window.location.href = 'sms:'+callingNumber+'?&body=https://webtel.dev.jacos.jp/rtc/';// view/contact.html?user_mobile_number='+callingNumber
                    console.log('send message to mobile!!' + callingNumber);
                    break;
                case "catch29":
                    swal.close();
//                location.reload(true);
                    break;

            }
        });
}
const callingAlertModal = (e) => {
    $('#selected_contact_modal').modal();
    $('#selected_contact_modal').modal('open');
    selected_contact_name = $(e).attr('data-name');
    selected_contact_number = $(e).attr('data-tel');
    selected_contact_id = $(e).attr('data-id');
    document.getElementById("selected_contact_name").innerHTML = selected_contact_name;
        /*swal(`${$(e).attr('data-name')}さんに電話しますか`, {
            buttons: {
                catch91: {
                    text: "無料通話",
                    value: "yes_call",
                },
                catch93: {
                    text: "通常の通話",
                    value: "yes_call_mobile",
                },
                catch192: {
                    text: "いいえ",
                    value: "cancel_call",
                },

            },
            allowOutsideClick: false,
            closeOnClickOutside: false
        })
            .then((value) => {
                switch (value) {
                    case "yes_call":
                        viewCallOption(e)
                        break;
                    case "yes_call_mobile":
                        window.location.href = 'tel:'+callingNumber;
                        break;
                    case "cancel_call":
                        swal.close();
                        break;

                }
            });*/
}
const x = () => {

}
function callingInModal(personal_contact) {
    if (personal_contact.length > 0) {
        let contact = personal_contact[0]
        let name    = contact.name.length > 0 ? contact.name[0] : '';
        let tel_    = contact.tel.length > 0 ? contact.tel[0] : '';
        swal(`${name}さんに電話しますか`, {
            buttons            : {
                catch91 : {
                    text : "はい",
                    value: "yes_call",
                },
                catch192: {
                    text : "いいえ",
                    value: "cancel_call",
                },

            },
            allowOutsideClick  : false,
            closeOnClickOutside: false
        }).then((value) => {
            switch (value) {
                case "yes_call":
                    tel           = tel_
                    callingNumber = tel_
                    $('#modalMakeCall').modal()
                    var user = urlParam('user_mobile_number');
                    if (user === tel) {
                        swal("私の番号です。");
                    } else {
                        requestCall()
                        $('#contact-name').text(name)
                    }
                    return false;
                    $('#call-option-').modal()
                    $('#call-option-').modal('open')
                    // location.href = 'tel:'+tel;
                    break;
                case "cancel_call":
                    swal.close();
                    break;
            }
        });
    }
}

function viewCallOption() {
    let tel_ = selected_contact_number
    tel = tel_
    callingNumber = tel_
    $('#modalMakeCall').modal()
    var user = urlParam('user_mobile_number');

    if (user === tel) {
        swal("私の番号です。");
    } else {
        let name = selected_contact_name;
        callForName = name;
        requestCall()
        $('#contact-name').text(name)
    }

    return false;
    $('#call-option-').modal()
    $('#call-option-').modal('open')



    // location.href = 'tel:'+tel;
}
function makeCallFromOption() {
    // location.href = 'tel:' + tel;

    try {
        directMakeCall(tel)
        contactLoadFromStorage();

    } catch (e) {
        alert(e.message)
        alert(e.message)
    }

}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function contactLoadFromStorage() {

    if(urlParam('type')==2){ //personal contacts
        if (localStorage.getItem("personal_contacts") !== null) {
            let personal_contacts = JSON.parse(localStorage.getItem("personal_contacts"));
            let data = '';
            data +='<div class="row" style="margin-bottom: 0px"> <div class="col s12"><input onclick="checkAllContacts(this);" style="pointer-events:auto !important; margin-top: 5px;" type="checkbox" name="check_all_contacts" id="check_all_contacts" value="check-all"> <img onclick="messagePotaconLink(\'send-link-to-all\')" hspace="50" src="./rsc/pwa-icon/icon_send.png" alt="" style="cursor: pointer;width: 25px; height: 25px; border: 1px solid #e6e6e6; border-radius:10px;"></div></div>';

            personal_contacts.map(function (cont) {
                let tel = cont.tel.toString();
                tel = tel.split(",");

                data += '<div class="row" style="margin-bottom: 0px"><div data-tel="' + tel[0] + '"  class="col s1 make-call-to-phone" style="margin-top: 10px;padding-left: 7px;padding-bottom: 0px"><input style="pointer-events:auto !important;" type="checkbox" name="contact_select" id="' + tel[0] + '" value="' + tel[0] + '"> </div><div onclick="viewCallOption(this)"  data-tel="' + tel[0] + '"  data-name="' + cont.name + '" class="col s8 make-call-to-phone" style="position: relative;cursor: pointer ;border-bottom: 1px solid #5c5a5a;padding-top: 0px;padding-left: 20px;padding-bottom: 0px" >\n' +
                        '                    <div style="font-size: 22px">' + cont.name + '</div>\n' +
                        '                    <div style="font-size: 22px" id="' + tel[0] + '">' + tel[0] + '</div>\n' +
                        // ' <a href="tel:'+cont.tel+'" class="waves-effect waves-light btn make-call-to-phone" style="position:absolute;right: 5px;border-radius: 10px;top: 0;" >コール</a>'+
                        '</div><div onclick="messagePotaconLink(this)" data-tel="' + tel[0] + '"  data-name="' + cont.name + '" class="col s3 make-call-to-phone" id="message_potacon_link" style="margin-top: 30px;padding-left: 20px;padding-bottom: 5px"><img src="./rsc/pwa-icon/icon_send.png" alt="" style="cursor: pointer;width: 40px; height: 40px; border: 1px solid #e6e6e6; border-radius:10px;"></div></div>'
            })

            $('#contact-list-view').html(data);
            //            location.reload(true);
        }
    }else if(urlParam('type')==1){
        if (localStorage.getItem("company_contacts") !== null) {
            let company_contacts = JSON.parse(localStorage.getItem("company_contacts"));
            let data = '';
            data +='<div class="row" style="margin-bottom: 0px"> <div class="col s12"><input onclick="checkAllContacts(this);" style="pointer-events:auto !important; margin-top: 5px;" type="checkbox" name="check_all_contacts" id="check_all_contacts" value="check-all"> <img onclick="messagePotaconLink(\'send-link-to-all\')" hspace="50" src="./rsc/pwa-icon/icon_send.png" alt="" style="cursor: pointer;width: 25px; height: 25px; border: 1px solid #e6e6e6; border-radius:10px;"></div></div>';

            company_contacts.map(function (cont) {
                let tel = cont.tel.toString();
                tel = tel.split(",");

                data += '<div class="row" style="margin-bottom: 0px"><div data-tel="' + tel[0] + '"  class="col s1 make-call-to-phone" style="margin-top: 10px;padding-left: 7px;padding-bottom: 0px"><input style="pointer-events:auto !important;" type="checkbox" name="contact_select" id="' + tel[0] + '" value="' + tel[0] + '"> </div><div onclick="viewCallOption(this)"  data-tel="' + tel[0] + '"  data-name="' + cont.name + '" class="col s8 make-call-to-phone" style="position: relative;cursor: pointer ;border-bottom: 1px solid #5c5a5a;padding-top: 0px;padding-left: 20px;padding-bottom: 0px" >\n' +
                        '                    <div style="font-size: 22px">' + cont.name + '</div>\n' +
                        '                    <div style="font-size: 22px" id="' + tel[0] + '">' + tel[0] + '</div>\n' +
                        // ' <a href="tel:'+cont.tel+'" class="waves-effect waves-light btn make-call-to-phone" style="position:absolute;right: 5px;border-radius: 10px;top: 0;" >コール</a>'+
                        '</div><div onclick="messagePotaconLink(this)" data-tel="' + tel[0] + '"  data-name="' + cont.name + '" class="col s3 make-call-to-phone" id="message_potacon_link" style="margin-top: 30px;padding-left: 20px;padding-bottom: 5px"><img src="./rsc/pwa-icon/icon_send.png" alt="" style="cursor: pointer;width: 40px; height: 40px; border: 1px solid #e6e6e6; border-radius:10px;"></div></div>'
            })

            $('#contact-list-view').html(data);
            //            location.reload(true);
        }
    }

}

function checkAllContacts(e) {
    if ($(e).val() == 'check-all') {
        $('[type="checkbox"]').prop('checked', true);
        $(e).val('uncheck-all');
    } else {
        $('[type="checkbox"]').prop('checked', false);
        $(e).val('check-all');
    }

//    var ele=document.getElementsByName('contact_select');
//    for(var i=0; i<ele.length; i++){
//        if(ele[i].type=='checkbox')
//            ele[i].checked=true;
//    }
}

function ownNumberRegistrationModal() {
    $('#mymodal33').modal();
    $('#mymodal33').modal('open');
}

function ownNumberRegistrationModalClose() {
    $('#mymodal33').modal('close');
}

function ownNumberRegistrationCheck() {
    if (!localStorage.getItem("myNumber")) {
        ownNumberRegistrationModal()
    } else {

    }
}
function ownNumberRegistration() {
    var name = document.getElementById("userNameToAdd").value;
    var number = document.getElementById("userNumberToAdd").value;
    if (name === "" || number === "") {
        swal("お名前と電話番号を\n入力してください。");
    } else {
        let myContact = {
            name : name,
            number : number
        }
        localStorage.setItem("myNumber",JSON.stringify(myContact))
        location.href = 'contact-load.html?type='+type+'&user_mobile_number='+number
    }
}
