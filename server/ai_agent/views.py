import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission

from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq 

from .tools import (
    get_total_employees,
    get_employee_details,
    get_pending_leaves_count,
    get_today_attendance_summary,
    get_latest_payslip_total,
    list_all_employees,
    get_admin_count,
    get_highest_paid_employee,
    get_project_info,
    execute_read_only_sql
)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"

class AIChatView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        user_message = request.data.get("message")
        chat_history = request.data.get("history", []) # <-- Accept history from frontend
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0,
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        tools = [
            get_total_employees, get_employee_details, get_pending_leaves_count,
            get_today_attendance_summary, get_latest_payslip_total, list_all_employees,
            get_admin_count, get_highest_paid_employee, get_project_info, execute_read_only_sql
        ]

        # Parse history into LangChain Message objects
        formatted_history = []
        for msg in chat_history:
            if msg.get("role") == "user":
                formatted_history.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "ai":
                formatted_history.append(AIMessage(content=msg.get("content", "")))

                prompt = ChatPromptTemplate.from_messages([
            ("system", """You are Astra, an intelligent, professional, and highly capable AI HR Assistant and Product Guide for the Employee Management System. 
            
            YOUR IDENTITY: Your name is Astra.
            
            YOUR CAPABILITIES:
            - You can answer questions about employees, attendance, leaves, payroll, and admin users by using the provided tools.
            - You can write raw PostgreSQL queries using the `execute_read_only_sql` tool.
            - You can guide the Admin on HOW to use the website.

            HOW THE WEBSITE WORKS (UI GUIDE):
            - To create an employee: Go to the "Employees" page in the sidebar, click the "Add Employee" button, fill out the form, and click "Create Employee".
            - To generate a payslip: Go to the "Payslips" page, click "Generate Payslip", select the employee, month, year, and salary details, then click "Generate".
            - To approve leaves: Go to the "Leave" page, filter by "PENDING", and click the green checkmark or red X.
            - To view attendance: Go to the "Attendance" page in the sidebar.
            - To update a profile: Go to the "Settings" page.

            DATABASE SCHEMA:
            - accounts_user: id, email, role (ADMIN/EMPLOYEE), first_name, last_name, date_joined
            - employees_employee: id, user_id, employee_id, first_name, last_name, department_id, position, basic_salary, is_deleted, join_date
            - departments_department: id, name
            - attendance_attendance: id, employee_id, date, check_in, check_out, status (PRESENT/LATE), working_hours
            - leaves_leaverequest: id, employee_id, leave_type, start_date, end_date, status (PENDING/APPROVED/REJECTED)
            - payroll_payslip: id, employee_id, month, year, basic_salary, allowances, deductions, net_salary

            RULES:
            1. USE THE CHAT HISTORY: If the user uses pronouns like "he", "she", "his", or "their", look at the previous messages to figure out who they are talking about.
            2. ALWAYS use your tools to fetch live data. NEVER guess or hallucinate numbers.
            3. HOW-TO QUESTIONS: If a user asks "How do I create/do something?", use the UI GUIDE above to explain the steps to them. Do NOT refuse these requests.
            4. SECURITY: If someone asks you to actually execute an INSERT, UPDATE, or DELETE SQL query, refuse (you are read-only). Never reveal passwords. However, explaining how the user can do it themselves in the UI is perfectly fine.
            5. If a predefined tool can answer the question, use it. If NOT, use the `execute_read_only_sql` tool.
            6. Keep your final answer friendly, concise, and use markdown.
            7. NEVER show the raw SQL query to the user.
            8. NEVER show raw database outputs or JSON arrays. Only summarize the data into a clean, easy-to-read format using bullet points or short sentences. DO NOT use markdown tables."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_tool_calling_agent(llm, tools, prompt)
        
        agent_executor = AgentExecutor(
            agent=agent, tools=tools, verbose=True, max_iterations=5, handle_parsing_errors=True
        )

        try:
            # Pass history to the executor
            response = agent_executor.invoke({
                "input": user_message,
                "chat_history": formatted_history
            })
            return Response({"response": response["output"]}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"AI Error: {str(e)}")
            return Response(
                {"response": "I am having trouble connecting to my brain right now. Please try again."},
                status=status.HTTP_200_OK
            )