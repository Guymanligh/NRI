function finishLesson(lessonNumber) {
    const currentProgress = parseInt(localStorage.getItem('completedLesson') || '0', 10);
            
    if (lessonNumber > currentProgress) {
        localStorage.setItem('completedLesson', lessonNumber);
        alert("Құттықтаймыз! Келесі сабақ ашылды.");
    }
    window.location.href = "../python.html"; 
    }