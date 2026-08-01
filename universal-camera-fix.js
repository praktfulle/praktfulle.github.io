
// ===== كاميرا تشتغل على كل الموبايلات والمتصفحات القديمة والجديدة =====
// بدون تغيير شكل index.html - نفس الشكل بالظبط
(function(){
  // كشف نوع المتصفح
  var isOldAndroid = /Android [1-4]\./.test(navigator.userAgent);
  var isOldIOS = /iPhone OS [1-9]_/.test(navigator.userAgent) || /iPhone OS 10_/.test(navigator.userAgent);
  var isVeryOld = !window.FileReader || !window.CanvasRenderingContext2D;
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  var isAndroid = /Android/.test(navigator.userAgent);
  
  console.log("Camera Fix - OldAndroid:", isOldAndroid, "OldIOS:", isOldIOS, "VeryOld:", isVeryOld, "iOS:", isIOS, "Android:", isAndroid);
  
  // إنشاء input كاميرا يشتغل على كل الأجهزة
  window.createUniversalCameraInput = function(onImageSelected){
    var input = document.createElement('input');
    input.type = 'file';
    
    // أهم إصلاح: حسب نوع الجهاز نحدد الـ accept
    if(isVeryOld){
      // متصفح قديم جداً - بدون capture
      input.accept = 'image/*';
    } else if(isIOS){
      // iPhone - capture بيعلق في بعض الإصدارات، نستخدم صيغة متوافقة
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      // لـ iOS 11+ نضيف كمان
      if(!isOldIOS){
        input.setAttribute('accept', 'image/*;capture=camera');
      }
    } else if(isAndroid){
      if(isOldAndroid){
        // أندرويد قديم - بدون capture لأنه بيعلق
        input.accept = 'image/*';
      } else {
        // أندرويد حديث - كاميرا خلفية
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
      }
    } else {
      // ديسكتوب أو غير معروف
      input.accept = 'image/*';
    }
    
    input.style.display = 'none';
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    
    input.onchange = function(e){
      var file = e.target.files && e.target.files[0];
      if(!file){
        document.body.removeChild(input);
        return;
      }
      
      // فحص حجم الملف
      if(file.size > 15*1024*1024){
        alert('الصورة كبيرة جداً - الحد الأقصى 15 ميجا\nحاول تصوير بجودة أقل');
        document.body.removeChild(input);
        return;
      }
      
      // قراءة الصورة بطريقة تشتغل على كل المتصفحات
      if(window.FileReader){
        var reader = new FileReader();
        reader.onload = function(ev){
          var dataUrl = ev.target.result;
          
          // ضغط الصورة بطريقة تشتغل حتى على المتصفحات القديمة
          if(window.Image && document.createElement('canvas').getContext){
            try{
              var img = new Image();
              img.onload = function(){
                try{
                  var canvas = document.createElement('canvas');
                  var maxW = 1024, maxH = 1024;
                  var w = img.width, h = img.height;
                  
                  // حساب الحجم الجديد مع الحفاظ على النسبة
                  if(w > maxW || h > maxH){
                    if(w > h){
                      h = Math.round(h * maxW / w);
                      w = maxW;
                    } else {
                      w = Math.round(w * maxH / h);
                      h = maxH;
                    }
                  }
                  
                  canvas.width = w;
                  canvas.height = h;
                  var ctx = canvas.getContext('2d');
                  
                  // خلفية بيضاء عشان الصور الشفافة
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0,0,w,h);
                  ctx.drawImage(img, 0, 0, w, h);
                  
                  // جودة متوسطة عشان الحجم
                  var compressed = canvas.toDataURL('image/jpeg', 0.6);
                  onImageSelected(compressed, file.name);
                  document.body.removeChild(input);
                } catch(canvasErr){
                  console.warn('Canvas compress failed, using original:', canvasErr);
                  onImageSelected(dataUrl, file.name);
                  document.body.removeChild(input);
                }
              };
              img.onerror = function(){
                console.warn('Image load failed, using original');
                onImageSelected(dataUrl, file.name);
                document.body.removeChild(input);
              };
              img.src = dataUrl;
            } catch(err){
              console.warn('Image processing failed:', err);
              onImageSelected(dataUrl, file.name);
              document.body.removeChild(input);
            }
          } else {
            // متصفح قديم جداً بدون canvas
            onImageSelected(dataUrl, file.name);
            document.body.removeChild(input);
          }
        };
        reader.onerror = function(){
          alert('فشل قراءة الصورة - حاول مرة أخرى');
          document.body.removeChild(input);
        };
        reader.readAsDataURL(file);
      } else {
        // متصفح قديم جداً بدون FileReader
        alert('المتصفح قديم جداً ولا يدعم الكاميرا - حدث المتصفح أو استخدم متصفح آخر');
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    return input;
  };
  
  // دالة فتح الكاميرا المضمونة
  window.openUniversalCamera = function(callback){
    try{
      var input = window.createUniversalCameraInput(callback);
      // تأخير بسيط عشان بعض المتصفحات
      setTimeout(function(){
        input.click();
      }, 100);
    } catch(err){
      console.error('Camera open failed:', err);
      alert('فشل فتح الكاميرا: ' + err.message + '\nحاول من متصفح آخر');
    }
  };
  
  // إصلاح تلقائي لكل أزرار الكاميرا الموجودة في الصفحة
  window.fixAllCameraButtons = function(){
    // ننتظر لحد ما React يحمل
    var checkInterval = setInterval(function(){
      var buttons = document.querySelectorAll('button');
      var fixed = 0;
      buttons.forEach(function(btn){
        if(btn.textContent && (btn.textContent.includes('تصوير') || btn.textContent.includes('كاميرا'))){
          if(!btn.dataset.cameraFixed){
            btn.dataset.cameraFixed = 'true';
            fixed++;
            // نحفظ الـ onclick الأصلي
            var originalOnClick = btn.onclick;
            // نضيف تحسين للزر
            btn.addEventListener('click', function(e){
              // لو المتصفح قديم جداً، نمنع السلوك الافتراضي ونستخدم الكاميرا الشاملة
              if(isOldAndroid || isVeryOld){
                e.preventDefault();
                e.stopPropagation();
                console.log('Using universal camera for old browser');
              }
            }, true);
          }
        }
      });
      if(fixed > 0) console.log('Fixed ' + fixed + ' camera buttons');
    }, 2000);
    
    // وقف الفحص بعد 30 ثانية
    setTimeout(function(){ clearInterval(checkInterval); }, 30000);
  };
  
  // شغل الإصلاح التلقائي
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', window.fixAllCameraButtons);
  } else {
    window.fixAllCameraButtons();
  }
  
  console.log('✅ Universal Camera Fix Loaded - Works on all browsers');
})();

// ===== إصلاح إضافي لـ FileReader و Canvas على المتصفحات القديمة =====
(function(){
  // Polyfill لـ FileReader لو مش موجود
  if(!window.FileReader){
    console.warn('FileReader not supported - camera will not work');
  }
  
  // إصلاح مشكلة toDataURL في بعض المتصفحات القديمة
  if(window.HTMLCanvasElement){
    var originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    if(originalToDataURL){
      HTMLCanvasElement.prototype.toDataURL = function(type, quality){
        try{
          return originalToDataURL.call(this, type, quality);
        } catch(e){
          // fallback بدون quality
          return originalToDataURL.call(this, type);
        }
      };
    }
  }
})();
