import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // Import CSS file for styling

function Home() {
  return (
    <div className="home-container">
      <div className="bg-image"></div> {/* Background image container */}
      <section className="hero">
        <div className="container">
          <h1>Welcome to QuickBite's Pizza & Subs</h1>
          <p>Delicious meals waiting for you. Explore our menu and order now!</p>
          <Link to="/menu" className="btn btn-primary">View Menu</Link>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="row">
            <div className="col-md-4">
              <div className="feature-box">
                <i className="fas fa-utensils"></i>
                <h3>Quality Ingredients</h3>
                <p>We use only the freshest and finest ingredients for our dishes.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box">
                <i className="fas fa-motorcycle"></i>
                <h3>Fast Delivery</h3>
                <p>Enjoy speedy delivery services right to your doorstep.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box">
                <i className="fas fa-money-bill-wave"></i>
                <h3>Affordable Prices</h3>
                <p>Great food at pocket-friendly prices. Value for your money guaranteed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
