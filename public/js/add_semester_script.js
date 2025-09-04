let courseCount = 0;

// Initialize with the specified number of courses
document.getElementById("numCourses").addEventListener("change", function () {
  const numCourses = parseInt(this.value);
  updateCourses(numCourses);
});

// Initialize with 1 courses by default
document.addEventListener("DOMContentLoaded", function () {
  updateCourses(1);
});

function updateCourses(numCourses) {
  const prevData = getCoursesData();
  const container = document.getElementById("coursesContainer");
  container.innerHTML = "";
  courseCount = 0;

  for (let i = 0; i < numCourses; i++) {
    addCourse();
  }
  restoreCoursesData(prevData);
}
function getCoursesData() {
  const courses = [];
  document.querySelectorAll(".course-item").forEach((item, idx) => {
    const emoji = item.querySelector(".emoji-input")?.value || "";
    const name = item.querySelector('input[name^="courses"][name$="[name]"]')?.value || "";
    const code = item.querySelector('input[name^="courses"][name$="[code]"]')?.value || "";
    const credits = item.querySelector('input[name^="courses"][name$="[credits]"]')?.value || "";
    const professor = item.querySelector('input[name^="courses"][name$="[professor]"]')?.value || "";
    const bucketing = item.querySelector('input[name^="courses"][name$="[bucketing]"]')?.value || "";
    courses.push({ emoji, name, code, credits, professor, bucketing });
  });
  return courses;
}

function restoreCoursesData(courses) {
  document.querySelectorAll(".course-item").forEach((item, idx) => {
    if (courses[idx]) {
      item.querySelector(".emoji-input").value = courses[idx].emoji;
      item.querySelector('input[name^="courses"][name$="[name]"]').value = courses[idx].name;
      item.querySelector('input[name^="courses"][name$="[code]"]').value = courses[idx].code;
      item.querySelector('input[name^="courses"][name$="[credits]"]').value = courses[idx].credits;
      item.querySelector('input[name^="courses"][name$="[professor]"]').value = courses[idx].professor;
      item.querySelector('input[name^="courses"][name$="[bucketing]"]').value = courses[idx].bucketing;
    }
  });
}

function addCourse() {
  courseCount++;
  const container = document.getElementById("coursesContainer");

  const courseHtml = `
          <div class="course-item" id="course-${courseCount}">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Course ${courseCount}</h5>
              <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeCourse(${courseCount})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            
            <div class="row">
              <div class="col-md-1 mb-3">
                <label class="form-label notion-label">Emoji</label>
                <input type="text" class="form-control notion-input emoji-input" 
                       name="courses[${courseCount}][emoji]" maxlength="2" value="📚">
              </div>
              <div class="col-md-5 mb-3">
                <label class="form-label notion-label">Course Name</label>
                <input type="text" class="form-control notion-input" 
                       name="courses[${courseCount}][name]" required>
              </div>
              <div class="col-md-3 mb-3">
                <label class="form-label notion-label">Course Code</label>
                <input type="text" class="form-control notion-input" 
                       name="courses[${courseCount}][code]">
              </div>
              <div class="col-md-3 mb-3">
                <label class="form-label notion-label">Credits</label>
                <input type="number" class="form-control notion-input" 
                       name="courses[${courseCount}][credits]" min="1" max="6"  value="4" required>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label notion-label">Professor</label>
                <input type="text" class="form-control notion-input" 
                       name="courses[${courseCount}][professor]">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label notion-label">Bucketing</label>
                <input type="text" class="form-control notion-input" 
                       name="courses[${courseCount}][bucketing]">
              </div>
            </div>
          </div>
        `;

  container.insertAdjacentHTML("beforeend", courseHtml);
}

function removeCourse(courseId) {
  const courseElement = document.getElementById(`course-${courseId}`);
  if (courseElement) {
    courseElement.remove();

    // Update the number of courses input
    const remainingCourses = document.querySelectorAll(".course-item").length;
    document.getElementById("numCourses").value = remainingCourses;
  }
}

// Form submission handling
// document
//   .getElementById("semesterForm")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();

//     // Collect form data
//     const formData = new FormData(this);
//     const data = {};

//     // Convert FormData to a regular object
//     for (let [key, value] of formData.entries()) {
//       data[key] = value;
//     }

//     console.log("Form data:", data);

//     // Here you would typically send the data to your server
//     alert("Semester data collected! Check the console for details.");
//   });
