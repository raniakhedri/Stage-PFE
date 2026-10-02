"""The trained churn models load and score customers (general and fashion models)."""
import predict


def _customer(**overrides):
    customer = {"tenureDays": 400, "totalOrders": 6, "totalSpent": 520.0, "avgOrderValue": 86.7,
                "orderFrequency": 0.45, "daysSinceLastOrder": 20}
    customer.update(overrides)
    return customer


def test_both_models_return_probabilities():
    for name in ("general", "clothes"):
        prob = predict.predict_rows([_customer(model=name)])[0]
        assert 0.0 <= prob <= 1.0


def test_inactive_customer_is_riskier_than_active_one():
    active, inactive = predict.predict_rows([_customer(), _customer(daysSinceLastOrder=330, orderFrequency=0.05)])
    assert inactive > active


def test_unknown_model_falls_back_to_general():
    assert 0.0 <= predict.predict_rows([_customer(model="unknown")])[0] <= 1.0
