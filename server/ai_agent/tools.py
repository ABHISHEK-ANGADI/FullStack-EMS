from langchain_core.tools import tool
from employees.models import Employee
from leaves.models import LeaveRequest
from attendance.models import Attendance
from payroll.models import Payslip
from accounts.models import User
from django.utils import timezone
from django.db.models import Sum
from django.db import connection
import re

@tool
def get_total_employees() -> int:
    """Returns the total number of active employees in the company."""
    return Employee.objects.filter(is_deleted=False).count()

@tool
def get_employee_details(name: str) -> str:
    """Finds an employee by their first or last name and returns their email, position, department, and employee ID."""
    employees = Employee.objects.filter(first_name__icontains=name) | Employee.objects.filter(last_name__icontains=name)
    if not employees:
        return f"No employee found with the name '{name}'."
    
    result = []
    for emp in employees[:5]:
        result.append(f"Name: {emp.first_name} {emp.last_name}, ID: {emp.employee_id}, Email: {emp.user.email}, Department: {emp.department.name}, Position: {emp.position}")
    return "\n".join(result)

@tool
def get_pending_leaves_count() -> int:
    """Returns the number of leave requests that are currently pending approval."""
    return LeaveRequest.objects.filter(status=LeaveRequest.STATUS_PENDING).count()

@tool
def get_today_attendance_summary() -> str:
    """Returns a summary of today's attendance (how many are present, late, or absent)."""
    today = timezone.localdate()
    present = Attendance.objects.filter(date=today, status="PRESENT").count()
    late = Attendance.objects.filter(date=today, status="LATE").count()
    return f"Today's Attendance: {present} Present, {late} Late."

@tool
def get_latest_payslip_total() -> str:
    """Returns the total net salary paid out in the most recent month that has payslips."""
    latest_date = Attendance.objects.order_by('-date').first()
    if not latest_date:
        return "No payroll data available."
    
    total = Employee.objects.filter(is_deleted=False).aggregate(Sum('basic_salary'))['basic_salary__sum'] or 0
    return f"The total monthly payroll (basic salary sum) is currently ${total}."

@tool
def list_all_employees() -> str:
    """Returns a list of the names and roles of all current employees."""
    employees = Employee.objects.filter(is_deleted=False)
    if not employees:
        return "There are no employees in the system."
    
    names = [f"- {emp.first_name} {emp.last_name} ({emp.position})" for emp in employees]
    return "Here are the current employees:\n" + "\n".join(names)

@tool
def get_admin_count() -> int:
    """Returns the total number of Admin users in the system."""
    return User.objects.filter(role="ADMIN").count()

@tool
def get_highest_paid_employee() -> str:
    """Returns the name of the employee who received the highest net salary in a payslip."""
    highest_payslip = Payslip.objects.order_by('-net_salary').first()
    if not highest_payslip:
        return "No payslips have been generated yet."
    
    emp = highest_payslip.employee
    return f"{emp.first_name} {emp.last_name} received the highest payslip of ${highest_payslip.net_salary} for {highest_payslip.month}/{highest_payslip.year}."

@tool
def get_project_info() -> str:
    """Returns information about what this Employee Management System project is."""
    return "This is a FullStack Employee Management System. It is built using React, Django REST Framework, and PostgreSQL. It allows HR/Admins to manage employees, track attendance, approve leaves, generate payroll, and view analytics."

@tool
def execute_read_only_sql(query: str) -> str:
    """
    Executes a raw SQL SELECT query against the PostgreSQL database to answer complex questions.
    Use this ONLY when a predefined tool cannot answer the user's question.
    You must write standard PostgreSQL syntax. 
    Only SELECT or WITH queries are allowed. Limit your results to 20 rows.
    """
    clean_query = query.strip().rstrip(';')
    
    # 1. Security Check: Must be a SELECT or WITH (CTE) query
    if not re.match(r'^(SELECT|WITH)\s', clean_query, re.IGNORECASE):
        return "ERROR: Only SELECT queries are allowed. You cannot modify the database."
        
    # 2. Security Check: Prevent forbidden modification keywords (defense in depth)
    forbidden_keywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE']
    for keyword in forbidden_keywords:
        if re.search(r'\b' + keyword + r'\b', clean_query, re.IGNORECASE):
            return f"ERROR: Keyword '{keyword}' is not allowed. Only read operations are permitted."
            
    # 3. Security Check: Prevent multiple statements
    if ";" in clean_query:
        return "ERROR: Multiple statements are not allowed."
        
    try:
        with connection.cursor() as cursor:
            # Force the database transaction to be READ ONLY
            cursor.execute("SET TRANSACTION READ ONLY;")
            cursor.execute(clean_query)
            
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            
            if not rows:
                return "No results found."
            
            # Limit results to prevent token overflow
            limit_note = ""
            if len(rows) > 20:
                rows = rows[:20]
                limit_note = "\n(Note: Results limited to first 20 rows)"
                
            # Format as CSV string for the AI to read
            result = [", ".join(columns)]
            for row in rows:
                result.append(", ".join(str(item) for item in row))
            
            return "\n".join(result) + limit_note
            
    except Exception as e:
        return f"SQL Error: {str(e)}"