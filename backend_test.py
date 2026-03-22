import requests
import sys
import json
from datetime import datetime

class WealthDockAPITester:
    def __init__(self, base_url="https://money-lens-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'expenses': [],
            'income': [],
            'investments': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, data = self.run_test("Categories", "GET", "categories", 200)
        if success and data:
            required_keys = ['expense_categories', 'income_sources', 'investment_types']
            for key in required_keys:
                if key not in data:
                    print(f"❌ Missing key: {key}")
                    return False
            print(f"   Categories loaded: {len(data['expense_categories'])} expense, {len(data['income_sources'])} income, {len(data['investment_types'])} investment")
        return success

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        success, data = self.run_test("Dashboard Summary", "GET", "dashboard/summary", 200)
        if success and data:
            required_keys = ['total_expenses', 'total_income', 'total_investments', 'net_savings']
            for key in required_keys:
                if key not in data:
                    print(f"❌ Missing key: {key}")
                    return False
            print(f"   Summary: Income=${data['total_income']}, Expenses=${data['total_expenses']}, Investments=${data['total_investments']}")
        return success

    def test_create_expense(self):
        """Test creating an expense"""
        expense_data = {
            "amount": 25.50,
            "category": "food",
            "description": "Test lunch expense",
            "date": "2024-01-15",
            "tags": "test",
            "recurring_period": "1_month"
        }
        success, data = self.run_test("Create Expense", "POST", "expenses", 200, expense_data)
        if success and data and 'id' in data:
            self.created_ids['expenses'].append(data['id'])
        return success

    def test_get_expenses(self):
        """Test getting all expenses"""
        success, data = self.run_test("Get Expenses", "GET", "expenses", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} expenses")
        return success

    def test_create_income(self):
        """Test creating an income entry"""
        income_data = {
            "amount": 5000.00,
            "source": "salary",
            "description": "Test monthly salary",
            "date": "2024-01-01",
            "recurring_period": "1_month"
        }
        success, data = self.run_test("Create Income", "POST", "income", 200, income_data)
        if success and data and 'id' in data:
            self.created_ids['income'].append(data['id'])
        return success

    def test_get_income(self):
        """Test getting all income entries"""
        success, data = self.run_test("Get Income", "GET", "income", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} income entries")
        return success

    def test_create_investment(self):
        """Test creating an investment"""
        investment_data = {
            "investment_type": "gold",
            "item_name": "Test Gold Bar 24K",
            "quantity": 100.0,
            "quantity_unit": "grams",
            "purchase_price": 6500.00,
            "currency": "USD",
            "date": "2024-01-10",
            "notes": "Test investment entry"
        }
        success, data = self.run_test("Create Investment", "POST", "investments", 200, investment_data)
        if success and data and 'id' in data:
            self.created_ids['investments'].append(data['id'])
        return success

    def test_get_investments(self):
        """Test getting all investments"""
        success, data = self.run_test("Get Investments", "GET", "investments", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} investments")
        return success

    def test_delete_expense(self):
        """Test deleting an expense"""
        if not self.created_ids['expenses']:
            print("⚠️  No expense ID to delete")
            return True
        
        expense_id = self.created_ids['expenses'][0]
        success, _ = self.run_test("Delete Expense", "DELETE", f"expenses/{expense_id}", 200)
        if success:
            self.created_ids['expenses'].remove(expense_id)
        return success

    def test_delete_income(self):
        """Test deleting an income entry"""
        if not self.created_ids['income']:
            print("⚠️  No income ID to delete")
            return True
        
        income_id = self.created_ids['income'][0]
        success, _ = self.run_test("Delete Income", "DELETE", f"income/{income_id}", 200)
        if success:
            self.created_ids['income'].remove(income_id)
        return success

    def test_delete_investment(self):
        """Test deleting an investment"""
        if not self.created_ids['investments']:
            print("⚠️  No investment ID to delete")
            return True
        
        investment_id = self.created_ids['investments'][0]
        success, _ = self.run_test("Delete Investment", "DELETE", f"investments/{investment_id}", 200)
        if success:
            self.created_ids['investments'].remove(investment_id)
        return success

    def test_export_endpoints(self):
        """Test export endpoints"""
        endpoints = [
            ("Export Master CSV", "export/master"),
            ("Export Expenses CSV", "export/expenses"),
            ("Export Income CSV", "export/income"),
            ("Export Investments CSV", "export/investments")
        ]
        
        all_passed = True
        for name, endpoint in endpoints:
            success, _ = self.run_test(name, "GET", endpoint, 200)
            if not success:
                all_passed = False
        
        return all_passed

    def cleanup_test_data(self):
        """Clean up any remaining test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete remaining expenses
        for expense_id in self.created_ids['expenses']:
            self.run_test("Cleanup Expense", "DELETE", f"expenses/{expense_id}", 200)
        
        # Delete remaining income
        for income_id in self.created_ids['income']:
            self.run_test("Cleanup Income", "DELETE", f"income/{income_id}", 200)
        
        # Delete remaining investments
        for investment_id in self.created_ids['investments']:
            self.run_test("Cleanup Investment", "DELETE", f"investments/{investment_id}", 200)

def main():
    print("🚀 Starting WealthDock API Tests")
    print("=" * 50)
    
    tester = WealthDockAPITester()
    
    # Test sequence
    test_functions = [
        tester.test_root_endpoint,
        tester.test_categories_endpoint,
        tester.test_dashboard_summary,
        tester.test_create_expense,
        tester.test_get_expenses,
        tester.test_create_income,
        tester.test_get_income,
        tester.test_create_investment,
        tester.test_get_investments,
        tester.test_dashboard_summary,  # Test again after adding data
        tester.test_delete_expense,
        tester.test_delete_income,
        tester.test_delete_investment,
        tester.test_export_endpoints
    ]
    
    failed_tests = []
    
    try:
        for test_func in test_functions:
            if not test_func():
                failed_tests.append(test_func.__name__)
    
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    
    finally:
        # Always cleanup
        tester.cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 Test Results")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())